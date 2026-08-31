import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const PUBLIC_USER = `id, name, email, phone, role, avatar_url, balance,
  preferred_language, is_active, created_at, updated_at`;

// Roles collected by RegisterPage's role step. OWNER / SUPER_ADMIN are
// singletons and must never be creatable from the public endpoint.
const ROLE_MAP = { consumer: "USER", courier: "DELIVERY" };

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password, role = "consumer" } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    const dbRole = ROLE_MAP[role];
    if (!dbRole) {
      return res.status(400).json({ error: "role must be 'consumer' or 'courier'" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, lower($2), $3, $4, $5)
       RETURNING ${PUBLIC_USER}`,
      [name, email, phone ?? null, passwordHash, dbRole],
    );
    const user = rows[0];
    return res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { rows } = await query("SELECT * FROM users WHERE email = lower($1)", [email]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.is_active) return res.status(403).json({ error: "Account is deactivated" });

    delete user.password_hash;
    return res.json({ user, token: signToken(user) });
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [
      req.user.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
