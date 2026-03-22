import { Router } from "express";
import { getDb } from "../lib/db.js";
import { buildDashboardInsights } from "../lib/portal.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  return res.status(200).json(buildDashboardInsights(db, userId));
});

export default router;
