import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN"];
const NUMERIC_ID = /^\d+$/;

// Admins see the shared ADMIN feed plus anything addressed to them personally.
const scope = (req) =>
  ADMIN_ROLES.includes(req.user.role) ? "(n.audience = 'ADMIN' OR n.id_user = $1)" : "n.id_user = $1";

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const where = scope(req);
    const [list, unread] = await Promise.all([
      query(
        `SELECT n.*, o.order_number, o.order_status
         FROM notification n
         LEFT JOIN orders o ON o.id = n.id_order
         WHERE ${where}
         ORDER BY n.created_at DESC
         LIMIT 50`,
        [req.user.id],
      ),
      query(`SELECT COUNT(*)::int AS unread FROM notification n WHERE ${where} AND NOT n.is_read`, [
        req.user.id,
      ]),
    ]);
    return res.json({ notifications: list.rows, unread: unread.rows[0].unread });
  } catch (err) {
    return next(err);
  }
});

router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await query(`UPDATE notification AS n SET is_read = TRUE WHERE ${scope(req)} AND NOT n.is_read`, [
      req.user.id,
    ]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    if (!NUMERIC_ID.test(req.params.id)) return res.status(404).json({ error: "Notification not found" });
    const { rows } = await query(
      `UPDATE notification AS n SET is_read = TRUE WHERE n.id = $2 AND ${scope(req)} RETURNING n.id`,
      [req.user.id, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Notification not found" });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
