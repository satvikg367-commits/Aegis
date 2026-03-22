import { Router } from "express";
import { getDb } from "../lib/db.js";
import { buildCareerInsights, buildCsdSummary, buildDashboardInsights } from "../lib/portal.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function makeResponse(title, answer, details = [], actions = [], reminders = []) {
  return { title, answer, details, actions, reminders };
}

router.post("/query", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const question = String(req.body?.question || "").trim();
  const lower = question.toLowerCase();
  const dashboard = buildDashboardInsights(db, userId);
  const latestResume =
    db.resumes
      .filter((resume) => resume.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;
  const resumeText = latestResume ? `${latestResume.summary} ${latestResume.skills} ${latestResume.experience}` : "";

  if (!question) {
    return res.status(200).json(
      makeResponse(
        "AEGIS Assistant",
        "I can help with pension status, healthcare claims, job guidance, and CSD ordering.",
        [
          "Ask: What is my pension status?",
          "Ask: Suggest jobs for me",
          "Ask: Help me file a healthcare claim",
          "Ask: Show CSD items I can order"
        ],
        [
          { label: "Check Pension", path: "/pension" },
          { label: "Open Healthcare", path: "/healthcare" },
          { label: "Explore Jobs", path: "/career" },
          { label: "Open CSD", path: "/csd" }
        ],
        dashboard.notificationSummary.items.slice(0, 2).map((item) => item.title)
      )
    );
  }

  if (lower.includes("pension")) {
    const profile = dashboard.pension.profile;
    return res.status(200).json(
      makeResponse(
        "Pension Status",
        profile
          ? `Your pension is ${dashboard.pension.status}. The next expected credit date is ${new Date(profile.nextPaymentDate).toLocaleDateString()}.`
          : "Your pension profile is not linked yet.",
        [
          `Monthly pension: INR ${Number(profile?.currentAmount || 0).toFixed(2)}`,
          `Active pension requests: ${dashboard.pension.activeRequests}`,
          dashboard.pension.latestPayment
            ? `Last credit: INR ${Number(dashboard.pension.latestPayment.amount).toFixed(2)}`
            : "No recent pension credit found"
        ],
        [{ label: "Open Pension Module", path: "/pension" }],
        ["Reminder: keep bank details and life certificate records up to date."]
      )
    );
  }

  if (lower.includes("job") || lower.includes("career") || lower.includes("suggest")) {
    const jobs = db.jobPostings
      .filter((job) => job.isActive)
      .map((job) => ({ ...job, ...buildCareerInsights(job, resumeText) }))
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 3);

    return res.status(200).json(
      makeResponse(
        "Career Recommendations",
        jobs.length
          ? `I found ${jobs.length} strong job options based on your service profile and resume.`
          : "I could not find active job recommendations right now.",
        jobs.map(
          (job) =>
            `${job.title} at ${job.company} - ${job.matchPercent}% match. Why: ${job.reason}`
        ),
        [{ label: "Open Career Module", path: "/career" }],
        jobs.flatMap((job) => job.upskilling).slice(0, 2)
      )
    );
  }

  if (lower.includes("claim") || lower.includes("healthcare") || lower.includes("medical")) {
    const latestClaim = dashboard.recentClaims[0];
    return res.status(200).json(
      makeResponse(
        "Healthcare Claim Guidance",
        latestClaim
          ? `Your latest healthcare claim is ${latestClaim.status} with ${latestClaim.progressPercent}% progress.`
          : "You do not have a recent claim, but I can guide you through filing one.",
        [
          "Step 1: Upload prescription, invoice, or discharge summary.",
          "Step 2: Use AI-assisted autofill to prefill claim type and amount.",
          "Step 3: Review remarks and submit the claim.",
          "Step 4: Track progress from Submitted to Under Review to final decision."
        ],
        [{ label: "File Healthcare Claim", path: "/healthcare" }],
        [latestClaim?.estimatedProcessingTime || "Most claims are reviewed in 5-7 working days."]
      )
    );
  }

  if (lower.includes("csd") || lower.includes("canteen") || lower.includes("order") || lower.includes("item")) {
    const csd = buildCsdSummary(db, userId);
    const order = csd.recentOrders[0];
    return res.status(200).json(
      makeResponse(
        "CSD Ordering Support",
        order
          ? `Your latest CSD order ${order.orderNumber} is ${order.status}. I also found popular items you can order now.`
          : "Here are subsidized CSD items you can order right now.",
        csd.popularItems.slice(0, 3).map(
          (item) =>
            `${item.name} - CSD price INR ${Number(item.subsidizedPrice).toFixed(0)} (${item.benefitLabel})`
        ),
        [{ label: "Open CSD Store", path: "/csd" }],
        ["Reminder: defence subsidized pricing is highlighted inside the CSD module."]
      )
    );
  }

  return res.status(200).json(
    makeResponse(
      "AEGIS Assistant",
      "I can help you with pension, healthcare claims, career guidance, and CSD orders.",
      [
        `Unread notifications: ${dashboard.notificationSummary.unreadCount}`,
        `Top job match: ${dashboard.jobRecommendations[0]?.title || "No active recommendation"}`,
        `Recent claim status: ${dashboard.recentClaims[0]?.status || "No recent claim"}`
      ],
      [
        { label: "Open Dashboard", path: "/" },
        { label: "Ask About Healthcare", prompt: "Help me file a healthcare claim" }
      ],
      dashboard.notificationSummary.items.slice(0, 3).map((item) => item.message)
    )
  );
});

export default router;
