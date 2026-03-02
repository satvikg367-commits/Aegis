import { Router } from "express";
import { addNotification, getDb, nextId, updateDb } from "../lib/db.js";
import { monthBounds } from "../lib/date.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function computeMonthlySummary(db, userId) {
  const profile = db.pensionProfiles.find((p) => p.userId === userId) || null;

  const { start, end } = monthBounds(new Date());
  const inMonth = (isoDate) => {
    const ts = new Date(isoDate).getTime();
    return ts >= start.getTime() && ts < end.getTime();
  };

  const monthlyPaymentTotal = db.pensionPayments
    .filter((p) => p.userId === userId && inMonth(p.paymentDate))
    .reduce((acc, row) => acc + Number(row.amount || 0), 0);

  const monthlyExpenseTotal = db.pensionExpenses
    .filter((e) => e.userId === userId && inMonth(e.expenseDate))
    .reduce((acc, row) => acc + Number(row.amount || 0), 0);

  const monthlyPensionBudget = profile ? Number(profile.currentAmount || 0) : monthlyPaymentTotal;
  const remainingBalance = monthlyPensionBudget - monthlyExpenseTotal;

  return {
    profile,
    monthlyPaymentTotal,
    monthlyExpenseTotal,
    monthlyPensionBudget,
    remainingBalance
  };
}

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const summary = computeMonthlySummary(db, userId);

  const payments = db.pensionPayments
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, 12);

  const requests = db.pensionRequests
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const expenses = db.pensionExpenses
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
    .slice(0, 30);

  return res.status(200).json({
    profile: summary.profile,
    payments,
    requests,
    expenses,
    monthlyPaymentTotal: summary.monthlyPaymentTotal,
    monthlyExpenseTotal: summary.monthlyExpenseTotal,
    monthlyPensionBudget: summary.monthlyPensionBudget,
    remainingBalance: summary.remainingBalance
  });
});

router.post("/requests", requireAuth, (req, res) => {
  const { requestType = "", details = "" } = req.body || {};
  if (!requestType.trim() || !details.trim()) {
    return res.status(400).json({ error: "requestType and details are required" });
  }

  const userId = req.auth.userId;

  let created = null;
  updateDb((db) => {
    const id = nextId(db, "pensionRequests");
    created = {
      id,
      userId,
      requestType: requestType.trim(),
      details: details.trim(),
      status: "Submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.pensionRequests.push(created);
    addNotification(
      db,
      userId,
      "Pension",
      "Pension request submitted",
      `Your request '${created.requestType}' has been submitted and is under review.`
    );
    return db;
  });

  return res.status(201).json({ message: "Request submitted", request: created });
});

router.post("/expenses", requireAuth, (req, res) => {
  const { category = "General", amount = 0, expenseDate = "", note = "" } = req.body || {};
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: "amount must be greater than 0" });
  }

  const parsedDate = expenseDate ? new Date(expenseDate) : new Date();
  const effectiveDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const userId = req.auth.userId;
  let created = null;

  updateDb((db) => {
    const id = nextId(db, "pensionExpenses");
    created = {
      id,
      userId,
      category: category.trim() || "General",
      amount: numericAmount,
      expenseDate: effectiveDate.toISOString(),
      note: note.trim(),
      createdAt: new Date().toISOString()
    };
    db.pensionExpenses.push(created);
    addNotification(
      db,
      userId,
      "Pension",
      "Expense added",
      `INR ${numericAmount.toFixed(2)} added under ${created.category}.`
    );
    return db;
  });

  return res.status(201).json({ message: "Expense added", expense: created });
});

export default router;
