import { Router } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { v4 as uuidv4 } from "uuid";
import { getDb, nextId, updateDb } from "../lib/db.js";
import { sanitizeUser, signToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { fullName = "", email = "", phone = "", password = "" } = req.body || {};

  if (!fullName.trim() || !email.trim() || !password) {
    return res.status(400).json({ error: "fullName, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();
  const existing = db.users.find((u) => u.email === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "Account already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let createdUser = null;
  updateDb((draft) => {
    const id = nextId(draft, "users");
    createdUser = {
      id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: "officer",
      passwordHash,
      twofaEnabled: false,
      twofaSecret: "",
      isActive: true,
      accessibility: {
        highContrast: false,
        fontScale: 100,
        textToSpeech: false
      },
      notificationPrefs: {
        pension: true,
        healthcare: true,
        career: true,
        csd: true
      },
      createdAt: new Date().toISOString()
    };
    draft.users.push(createdUser);
    return draft;
  });

  return res.status(201).json({ user: sanitizeUser(createdUser) });
});

router.post("/login", async (req, res) => {
  const { email = "", password = "", code = "" } = req.body || {};
  const normalizedEmail = email.trim().toLowerCase();

  const db = getDb();
  const user = db.users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Account inactive" });
  }

  if (user.twofaEnabled) {
    if (!code) {
      return res.status(200).json({ requires2fa: true, message: "2FA code required" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twofaSecret,
      encoding: "base32",
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: "Invalid 2FA code", requires2fa: true });
    }
  }

  const token = signToken(user);
  return res.status(200).json({ token, user: sanitizeUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  return res.status(200).json({ user: sanitizeUser(user) });
});

router.post("/password/forgot", (req, res) => {
  const { email = "" } = req.body || {};
  const normalizedEmail = email.trim().toLowerCase();

  let generatedToken = null;

  updateDb((db) => {
    const user = db.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return db;
    }

    generatedToken = uuidv4();
    const id = nextId(db, "passwordResetTokens");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.passwordResetTokens.push({
      id,
      userId: user.id,
      token: generatedToken,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    });
    return db;
  });

  return res.status(200).json({
    message: "If account exists, password reset token has been generated.",
    resetToken: generatedToken
  });
});

router.post("/password/reset", async (req, res) => {
  const { token = "", newPassword = "" } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const db = getDb();
  const tokenRow = db.passwordResetTokens.find((row) => row.token === token);
  if (!tokenRow || tokenRow.used || new Date(tokenRow.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: "Reset token is invalid or expired" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  updateDb((draft) => {
    const user = draft.users.find((u) => u.id === tokenRow.userId);
    const draftToken = draft.passwordResetTokens.find((row) => row.token === token);
    if (!user || !draftToken) return draft;
    user.passwordHash = passwordHash;
    draftToken.used = true;
    return draft;
  });

  return res.status(200).json({ message: "Password updated successfully" });
});

router.post("/2fa/setup", requireAuth, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const secret = speakeasy.generateSecret({
    name: `DefenceRetireePortal:${user.email}`,
    issuer: "DefenceRetireePortal"
  });

  updateDb((draft) => {
    const u = draft.users.find((item) => item.id === user.id);
    if (u) {
      u.twofaTempSecret = secret.base32;
    }
    return draft;
  });

  return res.status(200).json({
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  });
});

router.post("/2fa/enable", requireAuth, (req, res) => {
  const { code = "" } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!user.twofaTempSecret) {
    return res.status(400).json({ error: "2FA setup not started" });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twofaTempSecret,
    encoding: "base32",
    token: code,
    window: 1
  });

  if (!verified) {
    return res.status(400).json({ error: "Invalid verification code" });
  }

  updateDb((draft) => {
    const u = draft.users.find((item) => item.id === user.id);
    if (!u) return draft;
    u.twofaEnabled = true;
    u.twofaSecret = u.twofaTempSecret;
    delete u.twofaTempSecret;
    return draft;
  });

  return res.status(200).json({ message: "2FA enabled" });
});

router.post("/2fa/disable", requireAuth, (req, res) => {
  updateDb((db) => {
    const user = db.users.find((u) => u.id === req.auth.userId);
    if (user) {
      user.twofaEnabled = false;
      user.twofaSecret = "";
      delete user.twofaTempSecret;
    }
    return db;
  });

  return res.status(200).json({ message: "2FA disabled" });
});

export default router;
