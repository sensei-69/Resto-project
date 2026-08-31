import { Router } from "express";
import { pool, query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildUpdate } from "../lib/util.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];

const OFFER_TYPES = ["PACK", "DISCOUNT", "HAPPY_HOUR"];

const OFFER_WITH_ITEMS = `
  SELECT o.*,
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
`;

async function replaceOfferItems(client, idOffer, items) {
  await client.query("DELETE FROM offer_product WHERE id_offer = $1", [idOffer]);
  for (const item of items) {
    await client.query(
      "INSERT INTO offer_product (id_offer, id_product, quantity) VALUES ($1, $2, $3)",
      [idOffer, item.id_product, Math.max(1, Number(item.quantity) || 1)],
    );
  }
}

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`${OFFER_WITH_ITEMS} GROUP BY o.id ORDER BY o.created_at DESC`);
    return res.json({ offers: rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(`${OFFER_WITH_ITEMS} WHERE o.id = $1 GROUP BY o.id`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Offer not found" });
    return res.json({ offer: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/", ...adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      title, type, price, discount_percent, availability_window,
      applies_to_whole_menu = false, is_active = true, items = [],
    } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "title is required" });
    if (!OFFER_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of ${OFFER_TYPES.join(", ")}` });
    }
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO offer
         (title, type, price, discount_percent, availability_window, applies_to_whole_menu, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, type, price ?? null, discount_percent ?? null, availability_window ?? null,
       applies_to_whole_menu, is_active],
    );
    await replaceOfferItems(client, rows[0].id, items);
    await client.query("COMMIT");
    return res.status(201).json({ offer: { ...rows[0], items } });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return res.status(400).json({ error: "Unknown product in items" });
    return next(err);
  } finally {
    client.release();
  }
});

router.patch("/:id", ...adminOnly, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = req.body ?? {};
    if (body.type !== undefined && !OFFER_TYPES.includes(body.type)) {
      return res.status(400).json({ error: `type must be one of ${OFFER_TYPES.join(", ")}` });
    }
    await client.query("BEGIN");

    const q = buildUpdate("offer", req.params.id, body, [
      "title", "type", "price", "discount_percent", "availability_window",
      "applies_to_whole_menu", "is_active",
    ]);
    let offer;
    if (q) {
      const { rows } = await client.query(q.text, q.values);
      offer = rows[0];
    } else {
      const { rows } = await client.query("SELECT * FROM offer WHERE id = $1", [req.params.id]);
      offer = rows[0];
    }
    if (!offer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Offer not found" });
    }

    if (Array.isArray(body.items)) {
      await replaceOfferItems(client, offer.id, body.items);
    }

    await client.query("COMMIT");
    return res.json({ offer });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return res.status(400).json({ error: "Unknown product in items" });
    return next(err);
  } finally {
    client.release();
  }
});

router.delete("/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM offer WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Offer not found" });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
