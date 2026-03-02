import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "replace-with-strong-secret";
const JWT_EXPIRES_IN = "8h";

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    twofaEnabled: user.twofaEnabled,
    isActive: user.isActive,
    accessibility: user.accessibility,
    notificationPrefs: user.notificationPrefs,
    createdAt: user.createdAt
  };
}
