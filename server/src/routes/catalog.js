import { Router } from "express";
import { pool, query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildUpdate, httpError } from "../lib/util.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];

/**
 * Every ingredient attached to a product must be eligible for the product's
 * category via CATEGORY_INGREDIENT — the category-scoped path from the brief.
 */
async function assertEligible(client, idCategory, ingredients) {
  if (!ingredients.length) return;
  const ids = ingredients.map((i) => Number(i.id_ingredient));
  const { rows } = await client.query(
    "SELECT id_ingredient FROM category_ingredient WHERE id_category = $1 AND id_ingredient = ANY($2::bigint[])",
    [idCategory, ids],
  );
  const eligible = new Set(rows.map((r) => Number(r.id_ingredient)));
  const missing = ids.filter((id) => !eligible.has(id));
  if (missing.length) {
    throw httpError(
      400,
      `Ingredients not eligible for this category: ${missing.join(", ")}. Add them to the category's list first.`,
    );
  }
}

async function replaceProductIngredients(client, idProduct, ingredients) {
  await client.query("DELETE FROM product_ingredient WHERE id_product = $1", [idProduct]);
  for (const ing of ingredients) {
    await client.query(
      `INSERT INTO product_ingredient
         (id_product, id_ingredient, is_ingredient, is_supplementaire, is_removable, price_supplementaire)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        idProduct,
        ing.id_ingredient,
        Boolean(ing.is_ingredient),
        Boolean(ing.is_supplementaire),
        Boolean(ing.is_removable),
        ing.price_supplementaire ?? null,
      ],
    );
  }
}

/* ------------------------------- Divisions ------------------------------- */

router.get("/divisions", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM division ORDER BY sort_order, name");
    return res.json({ divisions: rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/divisions", ...adminOnly, async (req, res, next) => {
  try {
    const { name, name_ar, image, sort_order = 0, is_available = true } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required" });
    const { rows } = await query(
      `INSERT INTO division (name, name_ar, image, sort_order, is_available)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, name_ar ?? null, image ?? null, sort_order, is_available],
    );
    return res.status(201).json({ division: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.patch("/divisions/:id", ...adminOnly, async (req, res, next) => {
  try {
    const q = buildUpdate("division", req.params.id, req.body ?? {}, [
      "name", "name_ar", "image", "sort_order", "is_available",
    ]);
    if (!q) return res.status(400).json({ error: "No updatable fields provided" });
    const { rows } = await query(q.text, q.values);
    if (!rows[0]) return res.status(404).json({ error: "Division not found" });
    return res.json({ division: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/divisions/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM division WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Division not found" });
    return res.status(204).end();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Division still has categories attached" });
    }
    return next(err);
  }
});

/* ------------------------------- Categories ------------------------------ */

router.get("/categories", async (req, res, next) => {
  try {
    const { division } = req.query;
    const { rows } = division
      ? await query("SELECT * FROM category WHERE id_division = $1 ORDER BY name", [division])
      : await query("SELECT * FROM category ORDER BY name");
    return res.json({ categories: rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/categories", ...adminOnly, async (req, res, next) => {
  try {
    const { name, image, is_available = true, id_category = null } = req.body ?? {};
    let { id_division } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required" });
    // Subcategories inherit the parent's division when not given explicitly.
    if (!id_division && id_category) {
      const parent = await query("SELECT id_division FROM category WHERE id = $1", [id_category]);
      id_division = parent.rows[0]?.id_division;
    }
    if (!id_division) return res.status(400).json({ error: "id_division is required" });
    const { rows } = await query(
      `INSERT INTO category (name, image, is_available, id_category, id_division)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, image ?? null, is_available, id_category, id_division],
    );
    return res.status(201).json({ category: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.patch("/categories/:id", ...adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = req.body ?? {};
    const q = buildUpdate("category", req.params.id, body, [
      "name", "image", "is_available", "id_category", "id_division",
    ]);
    if (!q) return res.status(400).json({ error: "No updatable fields provided" });

    await client.query("BEGIN");
    const { rows } = await client.query(q.text, q.values);
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }
    // Keep descendant subcategories' id_division in sync (brief requirement).
    if (body.id_division !== undefined) {
      await client.query(
        `WITH RECURSIVE sub AS (
           SELECT id FROM category WHERE id_category = $1
           UNION ALL
           SELECT c.id FROM category c JOIN sub s ON c.id_category = s.id
         )
         UPDATE category SET id_division = $2 WHERE id IN (SELECT id FROM sub)`,
        [req.params.id, body.id_division],
      );
    }
    await client.query("COMMIT");
    return res.json({ category: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
});

router.delete("/categories/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM category WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Category not found" });
    return res.status(204).end();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Category still has products or subcategories" });
    }
    return next(err);
  }
});

/* ------------------------- Category ingredient list ---------------------- */

router.get("/categories/:id/ingredients", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT i.*, ci.is_ingredient, ci.is_supplementaire
       FROM category_ingredient ci
       JOIN ingredient i ON i.id = ci.id_ingredient
       WHERE ci.id_category = $1 AND i.is_available
       ORDER BY i.name`,
      [req.params.id],
    );
    return res.json({ ingredients: rows });
  } catch (err) {
    return next(err);
  }
});

// "Quick add to this category" from the dish editor — upserts eligibility.
router.post("/categories/:id/ingredients", ...adminOnly, async (req, res, next) => {
  try {
    const { id_ingredient, is_ingredient = true, is_supplementaire = false } = req.body ?? {};
    if (!id_ingredient) return res.status(400).json({ error: "id_ingredient is required" });
    const { rows } = await query(
      `INSERT INTO category_ingredient (id_category, id_ingredient, is_ingredient, is_supplementaire)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_category, id_ingredient)
       DO UPDATE SET is_ingredient = EXCLUDED.is_ingredient,
                     is_supplementaire = EXCLUDED.is_supplementaire
       RETURNING *`,
      [req.params.id, id_ingredient, is_ingredient, is_supplementaire],
    );
    return res.status(201).json({ category_ingredient: rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ error: "Unknown category or ingredient" });
    }
    return next(err);
  }
});

router.delete("/categories/:id/ingredients/:ingredientId", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM category_ingredient WHERE id_category = $1 AND id_ingredient = $2",
      [req.params.id, req.params.ingredientId],
    );
    if (!rowCount) return res.status(404).json({ error: "Not in this category's list" });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

/* ------------------------------ Ingredients ------------------------------ */

router.get("/ingredients", async (_req, res, next) => {
  try {
    // category_ids powers the associate/dissociate chips in the admin menu.
    const { rows } = await query(
      `SELECT i.*,
              COALESCE(
                json_agg(ci.id_category) FILTER (WHERE ci.id_category IS NOT NULL),
                '[]'
              ) AS category_ids
       FROM ingredient i
       LEFT JOIN category_ingredient ci ON ci.id_ingredient = i.id
       GROUP BY i.id
       ORDER BY i.name`,
    );
    return res.json({ ingredients: rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/ingredients", ...adminOnly, async (req, res, next) => {
  try {
    const { name, image, is_available = true } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required" });
    const { rows } = await query(
      "INSERT INTO ingredient (name, image, is_available) VALUES ($1, $2, $3) RETURNING *",
      [name, image ?? null, is_available],
    );
    return res.status(201).json({ ingredient: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An ingredient with this name already exists" });
    }
    return next(err);
  }
});

router.patch("/ingredients/:id", ...adminOnly, async (req, res, next) => {
  try {
    const q = buildUpdate("ingredient", req.params.id, req.body ?? {}, ["name", "image", "is_available"]);
    if (!q) return res.status(400).json({ error: "No updatable fields provided" });
    const { rows } = await query(q.text, q.values);
    if (!rows[0]) return res.status(404).json({ error: "Ingredient not found" });
    return res.json({ ingredient: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/ingredients/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM ingredient WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Ingredient not found" });
    return res.status(204).end();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Ingredient is referenced by orders" });
    }
    return next(err);
  }
});

/* -------------------------------- Products ------------------------------- */

router.get("/products", async (req, res, next) => {
  try {
    const { category } = req.query;
    const { rows } = category
      ? await query("SELECT * FROM product WHERE id_category = $1 ORDER BY name", [category])
      : await query("SELECT * FROM product ORDER BY name");
    return res.json({ products: rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id_ingredient', pi.id_ingredient,
                    'name', i.name,
                    'is_ingredient', pi.is_ingredient,
                    'is_supplementaire', pi.is_supplementaire,
                    'is_removable', pi.is_removable,
                    'price_supplementaire', pi.price_supplementaire
                  )
                ) FILTER (WHERE pi.id_ingredient IS NOT NULL),
                '[]'
              ) AS ingredients
       FROM product p
       LEFT JOIN product_ingredient pi ON pi.id_product = p.id
       LEFT JOIN ingredient i ON i.id = pi.id_ingredient
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Product not found" });
    return res.json({ product: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/products", ...adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      name, description, price, image, is_available = true, id_category, ingredients = [],
    } = req.body ?? {};
    if (!name || price === undefined || !id_category) {
      return res.status(400).json({ error: "name, price and id_category are required" });
    }
    await client.query("BEGIN");
    await assertEligible(client, id_category, ingredients);
    const { rows } = await client.query(
      `INSERT INTO product (name, description, price, image, is_available, id_category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description ?? null, price, image ?? null, is_available, id_category],
    );
    await replaceProductIngredients(client, rows[0].id, ingredients);
    await client.query("COMMIT");
    return res.status(201).json({ product: { ...rows[0], ingredients } });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
});

router.patch("/products/:id", ...adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = req.body ?? {};
    await client.query("BEGIN");

    const q = buildUpdate("product", req.params.id, body, [
      "name", "description", "price", "image", "is_available", "id_category",
    ]);
    let product;
    if (q) {
      const { rows } = await client.query(q.text, q.values);
      product = rows[0];
    } else {
      const { rows } = await client.query("SELECT * FROM product WHERE id = $1", [req.params.id]);
      product = rows[0];
    }
    if (!product) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    // Replacing the ingredient set re-validates against the (possibly new)
    // category — covers the "changed category mid-edit" rule from the brief.
    if (Array.isArray(body.ingredients)) {
      await assertEligible(client, product.id_category, body.ingredients);
      await replaceProductIngredients(client, product.id, body.ingredients);
    }

    await client.query("COMMIT");
    return res.json({ product });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
});

router.delete("/products/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM product WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Product not found" });
    return res.status(204).end();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Product is referenced by orders or offers" });
    }
    return next(err);
  }
});

export default router;
