import { Router } from "express";
import { getDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const { category = "" } = req.query;
  const db = getDb();

  let resources = [...db.resourceItems].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (String(category).trim()) {
    resources = resources.filter((item) => item.category === String(category).trim());
  }

  const categories = [
    "Financial Planning",
    "Health Management",
    "Career Transition",
    "Legal and Documentation",
    "Digital Literacy",
    "General"
  ];

  return res.status(200).json({ resources, categories });
});

export default router;
