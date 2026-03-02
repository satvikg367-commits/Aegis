import { getDb } from "../lib/db.js";
import { verifyToken } from "../lib/auth.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyToken(token);
    const db = getDb();
    const user = db.users.find((u) => u.id === payload.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid account" });
    }

    req.auth = { userId: user.id, role: user.role, email: user.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
