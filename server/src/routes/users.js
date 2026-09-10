import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildUpdate } from "../lib/util.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];
const PROTECTED_ROLES = ["OWNER", "SUPER_ADMIN"];

// Everything about a user that may leave the server: never password_hash,
// never a full card number.
const USER_COLS = [
  "id", "name", "email", "phone", "role", "avatar_url", "balance", "preferred_language",
  "is_active", "card_holder", "card_last4", "card_brand", "card_expiry", "default_address",
  "created_at", "updated_at",
];
const PUBLIC_USER = USER_COLS.map((c) => `u.${c}`).join(", ");
const RETURN_USER = USER_COLS.join(", ");

router.get("/", ...adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${PUBLIC_USER},
              COUNT(o.id)::int AS orders_count,
              COALESCE(SUM(o.total), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.id_customer = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    );
    return res.json({ users: rows });
  } catch (err) {
    return next(err);
  }
});

// Signed-in users can update their own profile (name, phone, avatar, language,
// default delivery address). Declared before the "/:id" routes so "me" is not
// parsed as an id.
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const q = buildUpdate("users", req.user.id, req.body ?? {}, [
      "name", "phone", "avatar_url", "preferred_language", "default_address",
    ]);
    if (!q) return res.status(400).json({ error: "No updatable fields provided" });
    const { rows } = await query(q.text, q.values);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    const user = rows[0];
    delete user.password_hash;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Saved card. Validation happens here; only holder / brand / last 4 / expiry
// are persisted so a database leak never exposes a usable card.
// ---------------------------------------------------------------------------
function luhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function brandOf(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(011|5)/.test(digits)) return "Discover";
  return "Card";
}

router.put("/me/card", requireAuth, async (req, res, next) => {
  try {
    const { card_holder, card_number, card_expiry, card_cvc } = req.body ?? {};
    const holder = typeof card_holder === "string" ? card_holder.trim() : "";
    const digits = String(card_number ?? "").replace(/\D/g, "");
    const cvc = String(card_cvc ?? "").replace(/\D/g, "");
    const m = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(String(card_expiry ?? "").trim());

    if (holder.length < 2) return res.status(400).json({ error: "Card holder name is required" });
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) {
      return res.status(400).json({ error: "Card number is not valid" });
    }
    if (!m) return res.status(400).json({ error: "Expiry must be MM/YY" });
    // Valid through the last day of the expiry month.
    if (new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date()) {
      return res.status(400).json({ error: "This card has expired" });
    }
    if (cvc.length < 3 || cvc.length > 4) return res.status(400).json({ error: "CVC must be 3 or 4 digits" });

    const { rows } = await query(
      `UPDATE users
       SET card_holder = $1, card_last4 = $2, card_brand = $3, card_expiry = $4
       WHERE id = $5 RETURNING ${RETURN_USER}`,
      [holder.slice(0, 80), digits.slice(-4), brandOf(digits), `${m[1]}/${m[2]}`, req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/me/card", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE users
       SET card_holder = NULL, card_last4 = NULL, card_brand = NULL, card_expiry = NULL
       WHERE id = $1 RETURNING ${RETURN_USER}`,
      [req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

async function loadTarget(id) {
  const { rows } = await query("SELECT id, role FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

router.patch("/:id", ...adminOnly, async (req, res, next) => {
  try {
    const target = await loadTarget(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (PROTECTED_ROLES.includes(target.role) && Number(target.id) !== req.user.id) {
      return res.status(403).json({ error: "Owner and Super Admin accounts can only be modified by themselves" });
    }
    const q = buildUpdate("users", req.params.id, req.body ?? {}, ["name", "phone", "is_active"]);
    if (!q) return res.status(400).json({ error: "No updatable fields provided" });
    const { rows } = await query(q.text, q.values);
    const user = rows[0];
    delete user.password_hash;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", ...adminOnly, async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    const target = await loadTarget(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (PROTECTED_ROLES.includes(target.role)) {
      return res.status(403).json({ error: "Owner and Super Admin accounts cannot be deleted" });
    }
    await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    return res.status(204).end();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "User is still referenced (e.g. assigned deliveries) \u2014 deactivate instead" });
    }
    return next(err);
  }
});

export default router;
