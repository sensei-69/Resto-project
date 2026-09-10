import { Router } from "express";
import { pool, query } from "../db.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/util.js";

const router = Router();
const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN"];
const adminOnly = [requireAuth, requireRole(...ADMIN_ROLES)];

const ORDER_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const INGREDIENT_ACTIONS = ["NORMAL", "REMOVED", "ADDED", "SUPPLEMENT"];
const PAID_ACTIONS = ["ADDED", "SUPPLEMENT"];
const NUMERIC_ID = /^\d+$/;

const orderNumber = () =>
  `EB-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const round2 = (n) => Math.round(n * 100) / 100;

// One row per order: customer / rider names, channel + payment labels and the
// full item snapshot (including what was removed / added on every line).
const ORDER_SELECT = `
  SELECT o.*,
         c.name  AS customer_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         d.name  AS delivery_person_name,
         ms.code AS method_of_sale,
         ms.name AS method_of_sale_name,
         pm.code AS payment_method,
         pm.name AS payment_method_name,
         COALESCE((
           SELECT json_agg(
                    json_build_object(
                      'id', oi.id,
                      'id_product', oi.id_product,
                      'id_offer', oi.id_offer,
                      'name', COALESCE(p.name, ofr.title),
                      'image', p.image,
                      'quantity', oi.quantity,
                      'unit_price', oi.unit_price,
                      'total_price', oi.total_price,
                      'ingredients', COALESCE((
                        SELECT json_agg(
                                 json_build_object(
                                   'id_ingredient', oii.id_ingredient,
                                   'name', ing.name,
                                   'action', oii.action,
                                   'price', oii.price
                                 ) ORDER BY oii.id)
                        FROM order_item_ingredient oii
                        JOIN ingredient ing ON ing.id = oii.id_ingredient
                        WHERE oii.id_order_item = oi.id
                      ), '[]'::json)
                    ) ORDER BY oi.id)
           FROM order_item oi
           LEFT JOIN product p   ON p.id   = oi.id_product
           LEFT JOIN offer   ofr ON ofr.id = oi.id_offer
           WHERE oi.id_order = o.id
         ), '[]'::json) AS items
  FROM orders o
  LEFT JOIN users c       ON c.id  = o.id_customer
  LEFT JOIN users d       ON d.id  = o.id_delivery_person
  JOIN method_of_sale ms  ON ms.id = o.id_method_of_sale
  JOIN payment_method pm  ON pm.id = o.id_payment_method
`;

async function loadOrder(id) {
  const { rows } = await query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Checkout lookups (public)
// ---------------------------------------------------------------------------
router.get("/options", async (_req, res, next) => {
  try {
    const [methods, payments, rules] = await Promise.all([
      query("SELECT id, code, name, description FROM method_of_sale ORDER BY id"),
      query("SELECT id, code, name, description FROM payment_method ORDER BY id"),
      query(
        `SELECT ms.code AS method_of_sale, pm.code AS payment_method
         FROM sale_payment_rule r
         JOIN method_of_sale ms ON ms.id = r.id_method_of_sale
         JOIN payment_method pm ON pm.id = r.id_payment_method
         ORDER BY ms.id, pm.id`,
      ),
    ]);
    return res.json({
      methods_of_sale: methods.rows,
      payment_methods: payments.rows,
      rules: rules.rows,
    });
  } catch (err) {
    return next(err);
  }
});

// Active riders, for the admin "assign" dropdown.
router.get("/riders", ...adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, name, phone FROM users WHERE role = 'DELIVERY' AND is_active ORDER BY name",
    );
    return res.json({ riders: rows });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Place an order
// ---------------------------------------------------------------------------
// Body: { items: [{ id_product | id_offer, quantity, ingredients?: [{ id_ingredient, action, quantity? }] }],
//         method_of_sale, payment_method, id_table?, notes? }
// Guest checkout allowed: id_customer is set only when a valid token is sent.
router.post("/", optionalAuth, async (req, res, next) => {
  const client = await pool.connect();
  let inTx = false;
  try {
    const { items, method_of_sale, payment_method, id_table, notes } = req.body ?? {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items is required and must be non-empty" });
    }

    const mos = await client.query("SELECT id FROM method_of_sale WHERE code = $1", [method_of_sale]);
    if (!mos.rows[0]) return res.status(400).json({ error: "Unknown method_of_sale code" });
    const pm = await client.query("SELECT id FROM payment_method WHERE code = $1", [payment_method]);
    if (!pm.rows[0]) return res.status(400).json({ error: "Unknown payment_method code" });

    const productIds = items
      .filter((i) => i.id_product !== undefined && i.id_product !== null)
      .map((i) => Number(i.id_product));
    const offerIds = items
      .filter((i) => (i.id_product === undefined || i.id_product === null) && i.id_offer !== undefined && i.id_offer !== null)
      .map((i) => Number(i.id_offer));

    const products = productIds.length
      ? (await client.query(
          "SELECT id, price, is_available FROM product WHERE id = ANY($1::bigint[])",
          [productIds],
        )).rows
      : [];
    const productById = new Map(products.map((p) => [Number(p.id), p]));

    const offers = offerIds.length
      ? (await client.query(
          "SELECT id, price, is_active FROM offer WHERE id = ANY($1::bigint[])",
          [offerIds],
        )).rows
      : [];
    const offerById = new Map(offers.map((o) => [Number(o.id), o]));

    // Supplement prices are snapshotted server-side from product_ingredient.
    const pairP = [];
    const pairI = [];
    for (const item of items) {
      if (item.id_product === undefined || item.id_product === null) continue;
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
        supplementPrice.set(
          `${Number(r.id_product)}:${Number(r.id_ingredient)}`,
          Number(r.price_supplementaire ?? 0),
        );
      }
    }

    await client.query("BEGIN");
    inTx = true;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (order_number, id_customer, id_table, id_method_of_sale, id_payment_method, notes, total)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [
        orderNumber(),
        req.user?.id ?? null,
        id_table ?? null,
        mos.rows[0].id,
        pm.rows[0].id,
        typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null,
      ],
    );
    const order = orderRows[0];

    let total = 0;
    for (const item of items) {
      const quantity = Math.max(1, Math.floor(Number(item.quantity)) || 1);
      let unitPrice = 0;
      let idProduct = null;
      let idOffer = null;

      if (item.id_product !== undefined && item.id_product !== null) {
        const product = productById.get(Number(item.id_product));
        if (!product) throw httpError(400, `Unknown product ${item.id_product}`);
        if (!product.is_available) throw httpError(400, `Product ${item.id_product} is not available`);
        unitPrice = Number(product.price);
        idProduct = Number(product.id);
      } else if (item.id_offer !== undefined && item.id_offer !== null) {
        const offer = offerById.get(Number(item.id_offer));
        if (!offer) throw httpError(400, `Unknown offer ${item.id_offer}`);
        if (!offer.is_active) throw httpError(400, `Offer ${item.id_offer} is no longer active`);
        if (offer.price === null || Number(offer.price) <= 0) {
          throw httpError(400, `Offer ${item.id_offer} has no pack price and cannot be ordered directly`);
        }
        unitPrice = Number(offer.price);
        idOffer = Number(offer.id);
      } else {
        throw httpError(400, "Each item needs an id_product or an id_offer");
      }

      // Ingredient customisations (products only). Paid extras carry their own
      // quantity and are NOT multiplied by the line quantity, matching the cart.
      const ingredientRows = [];
      let extras = 0;
      for (const ing of item.ingredients ?? []) {
        if (idProduct === null) throw httpError(400, "Offer packs cannot be customised");
        if (!INGREDIENT_ACTIONS.includes(ing.action)) {
          throw httpError(400, `action must be one of ${INGREDIENT_ACTIONS.join(", ")}`);
        }
        const paid = PAID_ACTIONS.includes(ing.action);
        const price = paid
          ? supplementPrice.get(`${idProduct}:${Number(ing.id_ingredient)}`) ?? 0
          : 0;
        const ingQty = paid ? Math.max(1, Math.floor(Number(ing.quantity)) || 1) : 1;
        for (let n = 0; n < ingQty; n += 1) {
          ingredientRows.push({ id_ingredient: Number(ing.id_ingredient), action: ing.action, price });
        }
        extras += price * ingQty;
      }

      const lineTotal = round2(unitPrice * quantity + extras);
      total += lineTotal;

      const { rows: itemRows } = await client.query(
        `INSERT INTO order_item (id_order, id_product, id_offer, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [order.id, idProduct, idOffer, quantity, unitPrice, lineTotal],
      );

      for (const row of ingredientRows) {
        await client.query(
          `INSERT INTO order_item_ingredient (id_order_item, id_ingredient, action, price)
           VALUES ($1, $2, $3, $4)`,
          [itemRows[0].id, row.id_ingredient, row.action, row.price],
        );
      }
    }

    await client.query("UPDATE orders SET total = $1 WHERE id = $2", [round2(total), order.id]);
    await client.query("COMMIT");
    inTx = false;

    const full = await loadOrder(order.id);
    return res.status(201).json({ order: full });
  } catch (err) {
    if (inTx) await client.query("ROLLBACK").catch(() => {});
    if (err.code === "23503" && String(err.constraint ?? "").includes("sale_payment_rule")) {
      return res.status(400).json({
        error: "This payment method is not available for the selected sale method",
      });
    }
    if (err.code === "23503") return res.status(400).json({ error: "Unknown reference in order" });
    if (err.code === "23514") return res.status(400).json({ error: "Invalid order line" });
    return next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------
// Customer order history ("My Orders").
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${ORDER_SELECT} WHERE o.id_customer = $1 ORDER BY o.created_at DESC`,
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
      `${ORDER_SELECT} WHERE o.id_delivery_person = $1 ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    return res.json({ orders: rows });
  } catch (err) {
    return next(err);
  }
});

// Admin: every order, optionally filtered by status.
router.get("/", ...adminOnly, async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    const { rows } = status
      ? await query(`${ORDER_SELECT} WHERE o.order_status = $1 ORDER BY o.created_at DESC`, [status])
      : await query(`${ORDER_SELECT} ORDER BY o.created_at DESC`);
    return res.json({ orders: rows });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Single order
// ---------------------------------------------------------------------------
// Visible to admins, the customer who placed it and the assigned rider.
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const isAdmin = ADMIN_ROLES.includes(req.user.role);
    const isCustomer = Number(order.id_customer) === req.user.id;
    const isRider = Number(order.id_delivery_person) === req.user.id;
    if (!isAdmin && !isCustomer && !isRider) {
      return res.status(403).json({ error: "You cannot view this order" });
    }
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

// Customers may cancel their own order as long as the kitchen has not
// confirmed it yet.
router.patch("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
    const { rows } = await query(
      `UPDATE orders SET order_status = 'CANCELED'
       WHERE id = $1 AND id_customer = $2 AND order_status = 'NEW'
       RETURNING id`,
      [req.params.id, req.user.id],
    );
    if (!rows[0]) {
      return res.status(409).json({
        error: "Only your own orders that are still waiting for confirmation can be cancelled",
      });
    }
    return res.json({ order: await loadOrder(req.params.id) });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------
router.patch("/:id/status", ...adminOnly, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
    const { order_status, payment_status } = req.body ?? {};
    if (order_status !== undefined && !ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ error: `order_status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ error: `payment_status must be one of ${PAYMENT_STATUSES.join(", ")}` });
    }
    if (order_status === undefined && payment_status === undefined) {
      return res.status(400).json({ error: "Provide order_status and/or payment_status" });
    }
    const { rows } = await query(
      `UPDATE orders
       SET order_status   = COALESCE($2::order_status, order_status),
           payment_status = COALESCE($3::payment_status, payment_status)
       WHERE id = $1 RETURNING id`,
      [req.params.id, order_status ?? null, payment_status ?? null],
    );
    if (!rows[0]) return res.status(404).json({ error: "Order not found" });
    return res.json({ order: await loadOrder(req.params.id) });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/assign", ...adminOnly, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
    const { id_delivery_person } = req.body ?? {};
    const { rows } = await query(
      "UPDATE orders SET id_delivery_person = $1 WHERE id = $2 RETURNING id",
      [id_delivery_person ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Order not found" });
    return res.json({ order: await loadOrder(req.params.id) });
  } catch (err) {
    // Raised by the check_delivery_person_role trigger.
    if (err.code === "P0001") return res.status(400).json({ error: err.message });
    if (err.code === "23503") return res.status(400).json({ error: "Unknown user" });
    return next(err);
  }
});

export default router;
