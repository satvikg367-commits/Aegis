import { Router } from "express";
import { getDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const pensionProfile = db.pensionProfiles.find((p) => p.userId === userId) || null;

  const latestPayment = db.pensionPayments
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0] || null;

  const activeStatuses = new Set(["Submitted", "Under Review", "Clarification Required"]);
  const activeRequests = db.pensionRequests.filter((r) => r.userId === userId && activeStatuses.has(r.status)).length;

  const upcomingAppointments = db.appointments
    .filter((a) => a.userId === userId && new Date(a.appointmentTime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
    .slice(0, 3)
    .map((a) => ({
      ...a,
      provider: db.healthcareProviders.find((p) => p.id === a.providerId) || null
    }));

  const recommendedJobs = db.jobPostings
    .filter((j) => j.isActive)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, 3);

  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return res.status(200).json({
    pensionProfile,
    latestPayment,
    activeRequests,
    upcomingAppointments,
    recommendedJobs,
    recentNotifications: notifications.slice(0, 5),
    unreadNotifications
  });
});

export default router;
