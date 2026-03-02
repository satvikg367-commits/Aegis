import { Router } from "express";
import { addNotification, getDb, nextId, updateDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const benefits = [
  "Cashless treatment at empanelled hospitals up to coverage limits.",
  "Annual preventive health check-up for retirees.",
  "Telehealth consultations for follow-up and non-emergency care.",
  "Claim support desk for reimbursement and document clarification."
];

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const providers = [...db.healthcareProviders].sort((a, b) => a.name.localeCompare(b.name));
  const appointments = db.appointments
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))
    .map((a) => ({
      ...a,
      provider: db.healthcareProviders.find((p) => p.id === a.providerId) || null
    }));

  const claims = db.healthcareClaims
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return res.status(200).json({ providers, appointments, claims, benefits });
});

router.post("/appointments", requireAuth, (req, res) => {
  const { providerId, appointmentTime, isTelehealth = false, note = "" } = req.body || {};
  if (!providerId || !appointmentTime) {
    return res.status(400).json({ error: "providerId and appointmentTime are required" });
  }

  const userId = req.auth.userId;
  const parsedTime = new Date(appointmentTime);
  if (Number.isNaN(parsedTime.getTime())) {
    return res.status(400).json({ error: "Invalid appointmentTime" });
  }

  const db = getDb();
  const provider = db.healthcareProviders.find((p) => p.id === Number(providerId));
  if (!provider) {
    return res.status(404).json({ error: "Provider not found" });
  }

  let appointment = null;
  updateDb((draft) => {
    const id = nextId(draft, "appointments");
    appointment = {
      id,
      userId,
      providerId: provider.id,
      appointmentTime: parsedTime.toISOString(),
      status: "Booked",
      isTelehealth: Boolean(isTelehealth),
      meetingLink: isTelehealth ? `https://telehealth.example.org/session/${userId}-${id}` : "",
      note: note.trim()
    };
    draft.appointments.push(appointment);
    addNotification(
      draft,
      userId,
      "Healthcare",
      "Appointment booked",
      `Your appointment with ${provider.name} is scheduled.`
    );
    return draft;
  });

  return res.status(201).json({ message: "Appointment booked", appointment });
});

router.post("/claims", requireAuth, (req, res) => {
  const { claimType = "", amount = 0, remarks = "" } = req.body || {};
  const numericAmount = Number(amount);
  if (!claimType.trim() || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: "claimType and positive amount are required" });
  }

  const userId = req.auth.userId;
  let claim = null;
  updateDb((db) => {
    const id = nextId(db, "healthcareClaims");
    claim = {
      id,
      userId,
      claimType: claimType.trim(),
      amount: numericAmount,
      status: "Under Review",
      remarks: remarks.trim(),
      submittedAt: new Date().toISOString()
    };
    db.healthcareClaims.push(claim);
    addNotification(db, userId, "Healthcare", "Claim submitted", `Claim #${id} has been submitted.`);
    return db;
  });

  return res.status(201).json({ message: "Claim submitted", claim });
});

export default router;
