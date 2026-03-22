import { Router } from "express";
import { getDb, updateDb } from "../lib/db.js";
import { sanitizeUser } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  return res.status(200).json({ user: sanitizeUser(user) });
});

router.put("/", requireAuth, (req, res) => {
  const { fullName = "", phone = "" } = req.body || {};

  updateDb((db) => {
    const user = db.users.find((u) => u.id === req.auth.userId);
    if (user) {
      if (fullName.trim()) user.fullName = fullName.trim();
      user.phone = phone.trim();
    }
    return db;
  });

  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  return res.status(200).json({ message: "Profile updated", user: sanitizeUser(user) });
});

router.put("/accessibility", requireAuth, (req, res) => {
  const { highContrast = false, textToSpeech = false, fontScale = 100 } = req.body || {};

  updateDb((db) => {
    const user = db.users.find((u) => u.id === req.auth.userId);
    if (user) {
      user.accessibility = {
        highContrast: Boolean(highContrast),
        textToSpeech: Boolean(textToSpeech),
        fontScale: Math.max(90, Math.min(130, Number(fontScale) || 100))
      };
    }
    return db;
  });

  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  return res.status(200).json({ message: "Accessibility settings updated", user: sanitizeUser(user) });
});

router.put("/notifications", requireAuth, (req, res) => {
  const {
    pension = false,
    healthcare = false,
    career = false,
    csd = false
  } = req.body || {};

  updateDb((db) => {
    const user = db.users.find((u) => u.id === req.auth.userId);
    if (user) {
      user.notificationPrefs = {
        pension: Boolean(pension),
        healthcare: Boolean(healthcare),
        career: Boolean(career),
        csd: Boolean(csd)
      };
    }
    return db;
  });

  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.userId);
  return res.status(200).json({ message: "Notification preferences updated", user: sanitizeUser(user) });
});

export default router;
