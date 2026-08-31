import { Router } from "express";
import { pool, query } from "../db.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { buildUpdate, httpError } from "../lib/util.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];

const ORDER_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const INGREDIENT_ACTIONS = ["NORMAL", "REMOVED", "ADDED", "SUPPLEMENT"];

const orderNumber = () =>
  `EB-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const ORDER_WITH_ITEMS = `
  SELECT o.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id_product', oi.id_product,
               'name', p.name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'total_price', oi.total_price
             )
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items
  FROM orders o
  LEFT JOIN order_item oi ON oi.id_order = o.id
  LEFT JOIN product p ON p.id = oi.id_product
`;

// Guest checkout allowed: id_customer is set only when a valid token is sent.
router.post("/", optionalAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { items, method_of_sale, payment_method, id_table, notes } = req.body ?? {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items is required and must be non-empty" });
    }

    const mos = await client.query("SELECT id FROM method_of_sale WHERE code = $1", [method_of_sale]);
    if (!mos.rows[0]) return res.status(400).json({ error: "Unknown method_of_sale code" });
    const pm = await client.query("SELECT id FROM payment_method WHERE code = $1", [payment_method]);
    if (!pm.rows[0]) return res.status(400).json({ error: "Unknown payment_method code" });

    const productIds = items.map((i) => Number(i.id_product));
    const { rows: products } = await client.query(
      "SELECT id, price, is_available FROM product WHERE id = ANY($1::bigint[])",
      [productIds],
    );
    const productById = new Map(products.map((p) => [Number(p.id), p]));

    // Supplement prices are snapshotted server-side from product_ingredient.
    const pairP = [];
    const pairI = [];
    for (const item of items) {
      for (const ing of item.ingredients ?? []) {
        pairP.push(Number(item.id_product));
        pairI.push(Number(ing.id_ingredient));
      }
    }
    const supplementPrice = new Map();
    if (pairP.length) {
      const { rows } = await client.query(
        `SELECT pi.id_product, pi.id_ingredient, pi.price_supplementaire
         FROM product_ingredient pi
         JOIN unnest($1::bigint[], $2::bigint[]) AS pair(id_product, id_ingredient)
           ON pair.id_product = pi.id_product AND pair.id_ingredient = pi.id_ingredient`,
        [pairP, pairI],
      );
      for (const r of rows) {
        supplementPrice.set(`${r.id_product}:${r.id_ingredient}`, Number(r.price_supplementaire ?? 0));
      }
    }

    await client.query("BEGIN");

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (order_number, id_customer, id_table, id_method_of_sale, id_payment_method, notes, total)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [orderNumber(), req.user?.id ?? null, id_table ?? null, mos.rows[0].id, pm.rows[0].id, notes ?? null],
    );
    const order = orderRows[0];

    let total = 0;
    for (const item of items) {
      const product = productById.get(Number(item.id_product));
      if (!product) throw httpError(400, `Unknown product ${item.id_product}`);
      if (!product.is_available) throw httpError(400, `Product ${item.id_product} is not available`);

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(product.price);

      let extrasPerUnit = 0;
      for (const ing of item.ingredients ?? []) {
        if (!INGREDIENT_ACTIONS.includes(ing.action)) {
          throw httpError(400, `action must be one of ${INGREDIENT_ACTIONS.join(", ")}`);
        }
        if (ing.action === "ADDED" || ing.action === "SUPPLEMENT") {
          extrasPerUnit += supplementPrice.get(`${item.id_product}:${ing.id_ingredient}`) ?? 0;
        }
      }

      const lineTotal = (unitPrice + extrasPerUnit) * quantity;
      total += lineTotal;

      const { rows: itemRows } = await client.query(
        `INSERT INTO order_item (id_order, id_product, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [order.id, item.id_product, quantity, unitPrice, lineTotal],
      );

      for (const ing of item.ingredients ?? []) {
        const price =
          ing.action === "ADDED" || ing.action === "SUPPLEMENT"
            ? supplementPrice.get(`${item.id_product}:${ing.id_ingredient}`) ?? 0
            : 0;
        await client.query(
          `INSERT INTO order_item_ingredient (id_order_item, id_ingredient, action, price)
           VALUES ($1, $2, $3, $4)`,
          [itemRows[0].id, ing.id_ingredient, ing.action, price],
        );
      }
    }

    const { rows: finalRows } = await client.query(
      "UPDATE orders SET total = $1 WHERE id = $2 RETURNING *",
      [total, order.id],
    );

    await client.query("COMMIT");
    return res.status(201).json({ order: finalRows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503" && String(err.constraint ?? "").includes("sale_payment_rule")) {
      return res.status(400).json({
        error: "This payment method is not available for the selected sale method",
      });
    }
    if (err.code === "23503") return res.status(400).json({ error: "Unknown reference in order" });
    return next(err);
  } finally {
    client.release();
  }
});

// Customer order history ("My Orders").
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${ORDER_WITH_ITEMS} WHERE o.id_customer = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    return res.json({ orders: rows });
  } catch (err) {
    return next(err);
  }
});

// Rider's assigned drops.
router.get("/assigned", requireAuth, requireRole("DELIVERY"), async (req, res, next) => {
  try {
    const { rows } = await query(
      `${ORDER_WITH_ITEMS} WHERE o.id_delivery_person = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    return res.json({ orders: rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/", ...adminOnly, async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    const { rows } = status
      ? await query(
          `${ORDER_WITH_ITEMS} WHERE o.order_status = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
          [status],
        )
      : await query(`${ORDER_WITH_ITEMS} GROUP BY o.id ORDER BY o.created_at DESC`);
    return res.json({ orders: rows });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/status", ...adminOnly, async (req, res, next) => {
  try {
    const { order_status, payment_status } = req.body ?? {};
    if (order_status !== undefined && !ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ error: `order_status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ error: `payment_status must be one of ${PAYMENT_STATUSES.join(", ")}` });
    }
    const q = buildUpdate("orders", req.params.id, { order_status, payment_status }, [
      "order_status", "payment_status",
    ]);
    if (!q) return res.status(400).json({ error: "Provide order_status and/or payment_status" });
    const { rows } = await query(q.text, q.values);
    if (!rows[0]) return res.status(404).json({ error: "Order not found" });
    return res.json({ order: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/assign", ...adminOnly, async (req, res, next) => {
  try {
    const { id_delivery_person } = req.body ?? {};
    const { rows } = await query(
      "UPDATE orders SET id_delivery_person = $1 WHERE id = $2 RETURNING *",
      [id_delivery_person ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Order not found" });
    return res.json({ order: rows[0] });
  } catch (err) {
    // Raised by the check_delivery_person_role trigger.
    if (err.code === "P0001") return res.status(400).json({ error: err.message });
    if (err.code === "23503") return res.status(400).json({ error: "Unknown user" });
    return next(err);
  }
});

export default router;
