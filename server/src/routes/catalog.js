import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/divisions", async (_req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM division WHERE is_available ORDER BY sort_order, name",
    );
    return res.json({ divisions: rows });
  } catch (err) {
    return next(err);
  }
});

// Division -> Category half of the dish-editor flow: optional ?division=<id>
// filters categories (including subcategories) to that division.
router.get("/categories", async (req, res, next) => {
  try {
    const { division } = req.query;
    const { rows } = division
      ? await query(
          "SELECT * FROM category WHERE id_division = $1 ORDER BY name",
          [division],
        )
      : await query("SELECT * FROM category ORDER BY name");
    return res.json({ categories: rows });
  } catch (err) {
    return next(err);
  }
});

// Category -> Ingredient half: only ingredients marked eligible for the
// category via CATEGORY_INGREDIENT are returned.
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

router.get("/products", async (req, res, next) => {
  try {
    const { category } = req.query;
    const { rows } = category
      ? await query(
          "SELECT * FROM product WHERE id_category = $1 ORDER BY name",
          [category],
        )
      : await query("SELECT * FROM product ORDER BY name");
    return res.json({ products: rows });
  } catch (err) {
    return next(err);
  }
});

// Offers with real product references + quantities (no display strings).
router.get("/offers", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id_product', op.id_product,
                    'quantity', op.quantity,
                    'name', p.name,
                    'image', p.image
                  )
                ) FILTER (WHERE op.id_product IS NOT NULL),
                '[]'
              ) AS items
       FROM offer o
       LEFT JOIN offer_product op ON op.id_offer = o.id
       LEFT JOIN product p ON p.id = op.id_product
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
    );
    return res.json({ offers: rows });
  } catch (err) {
    return next(err);
  }
});

export default router;
