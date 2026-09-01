import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildUpdate } from "../lib/util.js";

const router = Router();
const adminOnly = [requireAuth, requireRole("OWNER", "SUPER_ADMIN")];
const PROTECTED_ROLES = ["OWNER", "SUPER_ADMIN"];

const PUBLIC_USER = `u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.balance,
  u.preferred_language, u.is_active, u.created_at, u.updated_at`;

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

// Signed-in users can update their own profile (name, phone, avatar, language).
// Declared before the "/:id" routes so "me" is not parsed as an id.
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const q = buildUpdate("users", req.user.id, req.body ?? {}, [
      "name", "phone", "avatar_url", "preferred_language",
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
