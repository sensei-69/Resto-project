import { Router } from "express";
import { pool, query } from "../db.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/util.js";
import { notifyAdmins, notifyUser } from "../lib/notify.js";
import {
  sendOrderCanceledEmail,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
} from "../lib/mailer.js";

const router = Router();
const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN"];
const adminOnly = [requireAuth, requireRole(...ADMIN_ROLES)];

const ORDER_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const INGREDIENT_ACTIONS = ["NORMAL", "REMOVED", "ADDED", "SUPPLEMENT"];
const PAID_ACTIONS = ["ADDED", "SUPPLEMENT"];
// Steps the customer is told about (in-app + email). PREPARING is too chatty.
const NOTIFY_STATUSES = ["CONFIRMED", "READY", "COMPLETED"];
const NUMERIC_ID = /^\d+$/;
const MIN_REASON = 3;
const MAX_REASON = 300;

const orderNumber = () =>
  `EB-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => `$${Number(n).toFixed(2)}`;

// One row per order: customer / rider names, channel + payment labels and the
// full item snapshot (including what was removed / added on every line).
const ORDER_SELECT = `
  SELECT o.*,
         c.name  AS customer_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         d.name  AS delivery_person_name,
         cb.name AS canceled_by_name,
         t.table_number,
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
  LEFT JOIN users c        ON c.id  = o.id_customer
  LEFT JOIN users d        ON d.id  = o.id_delivery_person
  LEFT JOIN users cb       ON cb.id = o.canceled_by
  LEFT JOIN dining_table t ON t.id  = o.id_table
  JOIN method_of_sale ms   ON ms.id = o.id_method_of_sale
  JOIN payment_method pm   ON pm.id = o.id_payment_method
`;

async function loadOrder(id) {
  const { rows } = await query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Coerce a request value to a positive integer id, or null when absent/invalid. */
function toId(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Trimmed cancellation reason, or null when too short to be useful. */
function cleanReason(value) {
  if (typeof value !== "string") return null;
  const reason = value.trim();
  return reason.length >= MIN_REASON ? reason.slice(0, MAX_REASON) : null;
}

/** 400 carrying a machine-readable code the checkout UI reacts to. */
function checkoutError(message, code, extra = {}) {
  const err = httpError(400, message);
  err.body = { error: message, code, ...extra };
  return err;
}

/** Fire-and-forget side effect: logged on failure, never surfaced to the client. */
function background(label, fn) {
  Promise.resolve()
    .then(fn)
    .catch((err) => console.error(`[orders] ${label} failed:`, err.message));
}

function statusText(order) {
  const m = order.method_of_sale;
  switch (order.order_status) {
    case "CONFIRMED":
      return "is confirmed and queued in the kitchen";
    case "READY":
      if (m === "DELIVERY") return "is on the way";
      if (m === "TAKE_AWAY") return "is ready for pickup";
      return "is ready and heading to your table";
    case "COMPLETED":
      return m === "DELIVERY" ? "has been delivered. Enjoy!" : "is complete. Enjoy!";
    default:
      return `is ${String(order.order_status).toLowerCase()}`;
  }
}

function afterPlaced(order) {
  const summary = order.items.map((i) => `${i.quantity}\u00d7 ${i.name}`).join(", ");
  background("notify placed", async () => {
    await notifyAdmins({
      type: "ORDER_NEW",
      title: `New ${order.method_of_sale_name.toLowerCase()} order #${order.order_number}`,
      body: `${order.customer_name ?? "Guest"} \u00b7 ${money(order.total)} \u00b7 ${summary}`,
      idOrder: order.id,
    });
    await notifyUser(order.id_customer, {
      type: "ORDER_PLACED",
      title: `Order #${order.order_number} placed`,
      body: `${money(order.total)} \u00b7 ${order.method_of_sale_name}. The kitchen will confirm it shortly.`,
      idOrder: order.id,
    });
  });
  background("email placed", () => sendOrderPlacedEmail(order));
}

function afterStatusChange(order, previousStatus) {
  if (order.order_status === previousStatus) return;
  if (order.order_status === "CANCELED") {
    background("notify canceled", () =>
      notifyUser(order.id_customer, {
        type: "ORDER_CANCELED",
        title: `Order #${order.order_number} was cancelled`,
        body: order.cancel_reason ? `Reason: ${order.cancel_reason}` : null,
        idOrder: order.id,
      }),
    );
    background("email canceled", () => sendOrderCanceledEmail(order));
    return;
  }
  if (!NOTIFY_STATUSES.includes(order.order_status)) return;
  background("notify status", () =>
    notifyUser(order.id_customer, {
      type: "ORDER_STATUS",
      title: `Order #${order.order_number} ${statusText(order)}`,
      body:
        order.delivery_person_name && order.method_of_sale === "DELIVERY"
          ? `Rider: ${order.delivery_person_name}`
          : null,
      idOrder: order.id,
    }),
  );
  background("email status", () => sendOrderStatusEmail(order));
}

/**
 * Cancel inside an open transaction: stamps who / why / when and refunds a
 * payment that was taken from the customer balance. `extraWhere` narrows the
 * orders that may be cancelled (its placeholders start at $4).
 * Returns the updated row or null when nothing matched.
 */
async function cancelInTx(client, { id, byUserId, reason, extraWhere = "", params = [] }) {
  const { rows } = await client.query(
    `UPDATE orders
     SET order_status   = 'CANCELED',
         cancel_reason  = $2,
         canceled_by    = $3,
         canceled_at    = now(),
         payment_status = CASE
           WHEN paid_from_balance AND payment_status = 'PAID' THEN 'REFUNDED'::payment_status
           ELSE payment_status
         END
     WHERE id = $1 AND order_status <> 'CANCELED' ${extraWhere}
     RETURNING id, id_customer, total, paid_from_balance,
               (payment_status = 'REFUNDED') AS refunded`,
    [id, reason, byUserId, ...params],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.refunded && row.paid_from_balance && row.id_customer) {
    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
      row.total,
      row.id_customer,
    ]);
  }
  return row;
}

// ---------------------------------------------------------------------------
// Checkout lookups (public)
// ---------------------------------------------------------------------------
router.get("/options", async (_req, res, next) => {
  try {
    const [methods, payments, rules, riders, tables] = await Promise.all([
      query("SELECT id, code, name, description FROM method_of_sale ORDER BY id"),
      query("SELECT id, code, name, description FROM payment_method ORDER BY id"),
      query(
        `SELECT ms.code AS method_of_sale, pm.code AS payment_method
         FROM sale_payment_rule r
         JOIN method_of_sale ms ON ms.id = r.id_method_of_sale
         JOIN payment_method pm ON pm.id = r.id_payment_method
         ORDER BY ms.id, pm.id`,
      ),
      // Riders the customer can pick for a delivery (name only, no contact data).
      query("SELECT id, name FROM users WHERE role = 'DELIVERY' AND is_active ORDER BY name"),
      query(
        "SELECT id, table_number, capacity FROM dining_table WHERE is_active ORDER BY table_number",
      ),
    ]);
    return res.json({
      methods_of_sale: methods.rows,
      payment_methods: payments.rows,
      rules: rules.rows,
      riders: riders.rows,
      tables: tables.rows,
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
//         method_of_sale, payment_method, id_table?, id_delivery_person?, delivery_address?, notes? }
// Rules: dine-in table is optional; delivery needs an address; cash is checked
// against (and taken from) the signed-in customer's balance; card needs a card
// on file. Guests may still order cash and pay at the counter.
router.post("/", optionalAuth, async (req, res, next) => {
  const client = await pool.connect();
  let inTx = false;
  try {
    const {
      items,
      method_of_sale,
      payment_method,
      id_table,
      id_delivery_person,
      delivery_address,
      notes,
    } = req.body ?? {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items is required and must be non-empty" });
    }

    const mos = await client.query("SELECT id FROM method_of_sale WHERE code = $1", [method_of_sale]);
    if (!mos.rows[0]) return res.status(400).json({ error: "Unknown method_of_sale code" });
    const pm = await client.query("SELECT id FROM payment_method WHERE code = $1", [payment_method]);
    if (!pm.rows[0]) return res.status(400).json({ error: "Unknown payment_method code" });

    // A table only makes sense for dine-in and a rider only for delivery;
    // anything else sent by the client is ignored.
    let tableId = null;
    if (method_of_sale === "DINE_IN" && toId(id_table) !== null) {
      const t = await client.query(
        "SELECT id FROM dining_table WHERE id = $1 AND is_active",
        [toId(id_table)],
      );
      if (!t.rows[0]) return res.status(400).json({ error: "This table is not available" });
      tableId = t.rows[0].id;
    }
    let riderId = null;
    if (method_of_sale === "DELIVERY" && toId(id_delivery_person) !== null) {
      const r = await client.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'DELIVERY' AND is_active",
        [toId(id_delivery_person)],
      );
      if (!r.rows[0]) return res.status(400).json({ error: "This rider is not available" });
      riderId = r.rows[0].id;
    }

    const address =
      typeof delivery_address === "string" ? delivery_address.trim().slice(0, 300) : "";
    if (method_of_sale === "DELIVERY" && !address) {
      return res
        .status(400)
        .json({ error: "Tell us where the order should be delivered", code: "ADDRESS_REQUIRED" });
    }

    if (payment_method === "CARD") {
      if (!req.user) {
        return res.status(401).json({ error: "Sign in to pay by card", code: "AUTH_REQUIRED" });
      }
      const card = await client.query("SELECT card_last4 FROM users WHERE id = $1", [req.user.id]);
      if (!card.rows[0]?.card_last4) {
        return res.status(400).json({ error: "Add a card to pay by card", code: "CARD_REQUIRED" });
      }
    }

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

    // Price every line before touching the database so the balance check
    // below sees the final total.
    const lines = [];
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
      lines.push({ idProduct, idOffer, quantity, unitPrice, lineTotal, ingredientRows });
    }
    total = round2(total);

    await client.query("BEGIN");
    inTx = true;

    // Payment. Cash from a signed-in customer is taken from the account
    // balance (row locked so two checkouts cannot overspend); guests pay at
    // the counter. Card is charged to the saved card.
    let paymentStatus = "PENDING";
    let paidFromBalance = false;
    if (payment_method === "CASH" && req.user) {
      const { rows } = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [
        req.user.id,
      ]);
      const balance = Number(rows[0]?.balance ?? 0);
      if (balance < total) {
        throw checkoutError(
          `Insufficient balance: you have ${money(balance)} and this order is ${money(total)}`,
          "INSUFFICIENT_BALANCE",
          { balance, total },
        );
      }
      await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [total, req.user.id]);
      paymentStatus = "PAID";
      paidFromBalance = true;
    } else if (payment_method === "CARD") {
      paymentStatus = "PAID";
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (order_number, id_customer, id_table, id_delivery_person,
          id_method_of_sale, id_payment_method, notes, total,
          payment_status, delivery_address, paid_from_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        orderNumber(),
        req.user?.id ?? null,
        tableId,
        riderId,
        mos.rows[0].id,
        pm.rows[0].id,
        typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null,
        total,
        paymentStatus,
        method_of_sale === "DELIVERY" ? address : null,
        paidFromBalance,
      ],
    );
    const order = orderRows[0];

    for (const line of lines) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO order_item (id_order, id_product, id_offer, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [order.id, line.idProduct, line.idOffer, line.quantity, line.unitPrice, line.lineTotal],
      );
      for (const row of line.ingredientRows) {
        await client.query(
          `INSERT INTO order_item_ingredient (id_order_item, id_ingredient, action, price)
           VALUES ($1, $2, $3, $4)`,
          [itemRows[0].id, row.id_ingredient, row.action, row.price],
        );
      }
    }

    await client.query("COMMIT");
    inTx = false;

    const full = await loadOrder(order.id);
    afterPlaced(full);
    return res.status(201).json({ order: full });
  } catch (err) {
    if (inTx) await client.query("ROLLBACK").catch(() => {});
    if (err.body) return res.status(err.status).json(err.body);
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
// confirmed it yet. Body: { reason? }. A balance payment is refunded.
router.patch("/:id/cancel", requireAuth, async (req, res, next) => {
  if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
  const client = await pool.connect();
  try {
    const reason = cleanReason(req.body?.reason) ?? "Cancelled by the customer";
    await client.query("BEGIN");
    const row = await cancelInTx(client, {
      id: req.params.id,
      byUserId: req.user.id,
      reason,
      extraWhere: "AND id_customer = $4 AND order_status = 'NEW'",
      params: [req.user.id],
    });
    if (!row) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Only your own orders that are still waiting for confirmation can be cancelled",
      });
    }
    await client.query("COMMIT");

    const order = await loadOrder(req.params.id);
    background("notify admin cancel", () =>
      notifyAdmins({
        type: "ORDER_CANCELED",
        title: `Order #${order.order_number} cancelled by the customer`,
        body: order.cancel_reason,
        idOrder: order.id,
      }),
    );
    return res.json({ order });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------
// Body: { order_status?, payment_status?, cancel_reason? }. Moving to CANCELED
// requires cancel_reason: it is stored on the order and relayed to the customer.
router.patch("/:id/status", ...adminOnly, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Order not found" });
    const { order_status, payment_status, cancel_reason } = req.body ?? {};
    if (order_status !== undefined && !ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ error: `order_status must be one of ${ORDER_STATUSES.join(", ")}` });
    }
    if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ error: `payment_status must be one of ${PAYMENT_STATUSES.join(", ")}` });
    }
    if (order_status === undefined && payment_status === undefined) {
      return res.status(400).json({ error: "Provide order_status and/or payment_status" });
    }

    const before = await loadOrder(req.params.id);
    if (!before) return res.status(404).json({ error: "Order not found" });

    if (order_status === "CANCELED") {
      const reason = cleanReason(cancel_reason);
      if (!reason) {
        return res.status(400).json({
          error: `Give a cancellation reason (at least ${MIN_REASON} characters)`,
          code: "REASON_REQUIRED",
        });
      }
      if (before.order_status === "CANCELED") {
        return res.status(409).json({ error: "This order is already cancelled" });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await cancelInTx(client, { id: req.params.id, byUserId: req.user.id, reason });
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } else {
      await query(
        `UPDATE orders
         SET order_status   = COALESCE($2::order_status, order_status),
             payment_status = COALESCE($3::payment_status, payment_status),
             -- Re-opening a cancelled order clears the cancellation audit.
             cancel_reason  = CASE WHEN $2::order_status IS NOT NULL THEN NULL ELSE cancel_reason END,
             canceled_by    = CASE WHEN $2::order_status IS NOT NULL THEN NULL ELSE canceled_by END,
             canceled_at    = CASE WHEN $2::order_status IS NOT NULL THEN NULL ELSE canceled_at END
         WHERE id = $1`,
        [req.params.id, order_status ?? null, payment_status ?? null],
      );
    }

    const order = await loadOrder(req.params.id);
    afterStatusChange(order, before.order_status);
    return res.json({ order });
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
