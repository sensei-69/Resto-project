import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    return next();
  };
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
