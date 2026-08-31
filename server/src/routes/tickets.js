import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN"];

// "Write a ticket" from the My Space dropdown lands here.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { subject, message } = req.body ?? {};
    if (!subject || !message) {
      return res.status(400).json({ error: "subject and message are required" });
    }
    const { rows } = await query(
      `INSERT INTO support_ticket (id_user, subject, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, subject, message],
    );
    return res.status(201).json({ ticket: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Users see their own tickets; Owner / Super Admin see all.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const isAdmin = ADMIN_ROLES.includes(req.user.role);
    const { rows } = isAdmin
      ? await query(
          `SELECT t.*, u.name AS user_name, u.email AS user_email
           FROM support_ticket t JOIN users u ON u.id = t.id_user
           ORDER BY t.created_at DESC`,
        )
      : await query(
          "SELECT * FROM support_ticket WHERE id_user = $1 ORDER BY created_at DESC",
          [req.user.id],
        );
    return res.json({ tickets: rows });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  "/:id/status",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res, next) => {
    try {
      const { status } = req.body ?? {};
      if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
        return res.status(400).json({ error: "status must be OPEN, IN_PROGRESS or CLOSED" });
      }
      const { rows } = await query(
        "UPDATE support_ticket SET status = $1 WHERE id = $2 RETURNING *",
        [status, req.params.id],
      );
      if (!rows[0]) return res.status(404).json({ error: "Ticket not found" });
      return res.json({ ticket: rows[0] });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
