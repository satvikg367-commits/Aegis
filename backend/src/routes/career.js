import { Router } from "express";
import { addNotification, getDb, nextId, updateDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;

  const jobs = db.jobPostings
    .filter((j) => j.isActive)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  const latestResume = db.resumes
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

  const applications = db.jobApplications
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .map((a) => ({
      ...a,
      job: db.jobPostings.find((j) => j.id === a.jobId) || null
    }));

  const workshops = [...db.workshops].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return res.status(200).json({ jobs, latestResume, applications, workshops });
});

router.put("/resume", requireAuth, (req, res) => {
  const { summary = "", skills = "", experience = "" } = req.body || {};
  if (!summary.trim() || !skills.trim() || !experience.trim()) {
    return res.status(400).json({ error: "summary, skills, and experience are required" });
  }

  const userId = req.auth.userId;
  let resume = null;

  updateDb((db) => {
    const existing = db.resumes.find((r) => r.userId === userId);
    if (existing) {
      existing.summary = summary.trim();
      existing.skills = skills.trim();
      existing.experience = experience.trim();
      existing.updatedAt = new Date().toISOString();
      resume = existing;
    } else {
      const id = nextId(db, "resumes");
      resume = {
        id,
        userId,
        summary: summary.trim(),
        skills: skills.trim(),
        experience: experience.trim(),
        updatedAt: new Date().toISOString()
      };
      db.resumes.push(resume);
    }

    addNotification(db, userId, "Career", "Resume updated", "Your resume has been saved.");
    return db;
  });

  return res.status(200).json({ message: "Resume saved", resume });
});

router.post("/apply", requireAuth, (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  const db = getDb();
  const userId = req.auth.userId;
  const job = db.jobPostings.find((j) => j.id === Number(jobId) && j.isActive);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const exists = db.jobApplications.find((a) => a.userId === userId && a.jobId === job.id);
  if (exists) {
    return res.status(200).json({ message: "Already applied", application: exists });
  }

  let application = null;
  updateDb((draft) => {
    const id = nextId(draft, "jobApplications");
    application = {
      id,
      userId,
      jobId: job.id,
      status: "Applied",
      appliedAt: new Date().toISOString()
    };
    draft.jobApplications.push(application);
    addNotification(draft, userId, "Career", "Job application submitted", `Applied to ${job.title}.`);
    return draft;
  });

  return res.status(201).json({ message: "Application submitted", application });
});

export default router;
