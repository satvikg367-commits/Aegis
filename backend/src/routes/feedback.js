import { Router } from "express";
import { getDb, nextId, updateDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const tickets = db.feedbackTickets
    .filter((ticket) => ticket.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({ tickets });
});

router.post("/", requireAuth, (req, res) => {
  const { category = "General", message = "" } = req.body || {};
  if (!message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const userId = req.auth.userId;
  let ticket = null;

  updateDb((db) => {
    const id = nextId(db, "feedbackTickets");
    ticket = {
      id,
      userId,
      category: category.trim() || "General",
      message: message.trim(),
      status: "Open",
      createdAt: new Date().toISOString()
    };
    db.feedbackTickets.push(ticket);
    return db;
  });

  return res.status(201).json({ message: "Feedback submitted", ticket });
});

export default router;
