const STATUS_PROGRESS = {
  Submitted: 28,
  "Under Review": 64,
  Approved: 100,
  Rejected: 100,
  "Interview Scheduled": 78,
  Applied: 42
};

const SKILL_SIGNAL_MAP = [
  {
    term: "security",
    label: "Security operations",
    reason: "Your defence background aligns with leadership in secure operations.",
    recommendation: "Take a short refresher on enterprise security governance."
  },
  {
    term: "operations",
    label: "Operations planning",
    reason: "This role values mission-style planning and structured execution.",
    recommendation: "Add civilian operations planning examples to your resume."
  },
  {
    term: "leadership",
    label: "Leadership",
    reason: "Command experience directly strengthens people leadership roles.",
    recommendation: "Highlight team-size, outcomes, and mentoring metrics."
  },
  {
    term: "compliance",
    label: "Compliance",
    reason: "Procedure discipline and audit-readiness match this requirement.",
    recommendation: "Complete a short compliance or governance certification."
  },
  {
    term: "training",
    label: "Training",
    reason: "Instruction and mentoring experience strengthen transition roles.",
    recommendation: "Build a portfolio of training modules or coaching outcomes."
  },
  {
    term: "mentor",
    label: "Mentorship",
    reason: "The role benefits from guidance, coaching, and people development.",
    recommendation: "Add mentoring achievements and workshop facilitation examples."
  },
  {
    term: "admin",
    label: "Administration",
    reason: "Administrative discipline maps well to structured civilian environments.",
    recommendation: "Show documentation, reporting, and workflow ownership."
  },
  {
    term: "logistics",
    label: "Logistics",
    reason: "Supply and movement coordination experience is directly relevant.",
    recommendation: "Take a basic supply chain or procurement upskilling module."
  }
];

function includesTerm(source, term) {
  return String(source || "").toLowerCase().includes(term);
}

export function scoreJobMatch(job, resumeText = "") {
  const source = `${job?.title || ""} ${job?.description || ""} ${job?.company || ""}`.toLowerCase();
  const profile = String(resumeText || "").toLowerCase();
  let score = 56;

  for (const signal of SKILL_SIGNAL_MAP) {
    const inJob = includesTerm(source, signal.term);
    const inProfile = includesTerm(profile, signal.term);
    if (inJob && inProfile) score += 9;
    if (inJob && !inProfile) score -= 2;
  }

  if (includesTerm(job?.location, "remote")) score += 3;
  if (includesTerm(source, "manager")) score += 2;

  return Math.max(54, Math.min(96, Math.round(score)));
}

export function buildCareerInsights(job, resumeText = "") {
  const source = `${job?.title || ""} ${job?.description || ""} ${job?.company || ""}`.toLowerCase();
  const profile = String(resumeText || "").toLowerCase();
  const matchedSignals = SKILL_SIGNAL_MAP.filter(
    (signal) => includesTerm(source, signal.term) && includesTerm(profile, signal.term)
  );
  const missingSignals = SKILL_SIGNAL_MAP.filter(
    (signal) => includesTerm(source, signal.term) && !includesTerm(profile, signal.term)
  );

  const reason =
    matchedSignals[0]?.reason ||
    "This opportunity aligns with service discipline, coordination, and leadership strengths.";

  return {
    matchPercent: scoreJobMatch(job, resumeText),
    reason,
    skillGaps: missingSignals.slice(0, 3).map((signal) => signal.label),
    upskilling: missingSignals.slice(0, 2).map((signal) => signal.recommendation)
  };
}

export function enrichClaim(claim) {
  const status = claim?.status || "Submitted";
  const progressPercent = STATUS_PROGRESS[status] || 30;
  const steps = [
    { key: "Submitted", label: "Submitted", isActive: true, isCompleted: true },
    {
      key: "Under Review",
      label: "Under Review",
      isActive: status === "Under Review",
      isCompleted: ["Under Review", "Approved", "Rejected"].includes(status)
    },
    {
      key: "ApprovedRejected",
      label: status === "Rejected" ? "Rejected" : "Approved",
      isActive: ["Approved", "Rejected"].includes(status),
      isCompleted: ["Approved", "Rejected"].includes(status)
    }
  ];

  const estimatedProcessingTime =
    status === "Approved"
      ? "Completed"
      : status === "Rejected"
        ? "Closed"
        : status === "Under Review"
          ? "Estimated 2-4 working days remaining"
          : "Estimated 5-7 working days";

  return {
    ...claim,
    documents: Array.isArray(claim?.documents) ? claim.documents : [],
    progressPercent,
    steps,
    estimatedProcessingTime
  };
}

export function buildCsdSummary(db, userId) {
  const products = (db.csdProducts || [])
    .filter((item) => item.isActive !== false)
    .sort((a, b) => Number(b.popularityScore || 0) - Number(a.popularityScore || 0));

  const orders = (db.csdOrders || [])
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    products,
    popularItems: products.slice(0, 4),
    recentOrders: orders.slice(0, 3)
  };
}

export function buildDashboardInsights(db, userId) {
  const pensionProfile = db.pensionProfiles.find((p) => p.userId === userId) || null;
  const latestPayment =
    db.pensionPayments
      .filter((payment) => payment.userId === userId)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0] || null;

  const pensionActiveStatuses = new Set(["Submitted", "Under Review", "Clarification Required"]);
  const activeRequests = db.pensionRequests.filter(
    (request) => request.userId === userId && pensionActiveStatuses.has(request.status)
  );

  const claims = db.healthcareClaims
    .filter((claim) => claim.userId === userId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .map(enrichClaim);

  const resume =
    db.resumes
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;
  const resumeText = resume ? `${resume.summary} ${resume.skills} ${resume.experience}` : "";

  const jobRecommendations = db.jobPostings
    .filter((job) => job.isActive)
    .map((job) => ({
      ...job,
      ...buildCareerInsights(job, resumeText)
    }))
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 2);

  const notifications = db.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const coreNotifications = notifications.filter((item) =>
    ["Pension", "Healthcare", "Career", "CSD"].includes(item.category)
  );

  const csd = buildCsdSummary(db, userId);

  return {
    pension: {
      profile: pensionProfile,
      latestPayment,
      activeRequests: activeRequests.length,
      status: activeRequests.length ? "Action Pending" : "On Track"
    },
    recentClaims: claims.slice(0, 3),
    jobRecommendations,
    csdQuickAccess: {
      recentOrders: csd.recentOrders,
      popularItems: csd.popularItems
    },
    notificationSummary: {
      unreadCount: coreNotifications.filter((item) => !item.isRead).length,
      items: coreNotifications.slice(0, 4)
    }
  };
}
