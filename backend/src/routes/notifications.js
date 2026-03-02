import { Router } from "express";
import { getDb, updateDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({ notifications });
});

router.post("/:id/read", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const userId = req.auth.userId;

  updateDb((db) => {
    const notification = db.notifications.find((n) => n.id === id && n.userId === userId);
    if (notification) {
      notification.isRead = true;
    }
    return db;
  });

  return res.status(200).json({ message: "Notification marked as read" });
});

router.post("/read-all", requireAuth, (req, res) => {
  const userId = req.auth.userId;

  updateDb((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    return db;
  });

  return res.status(200).json({ message: "All notifications marked as read" });
});

export default router;
