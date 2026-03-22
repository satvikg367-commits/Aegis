const SKILL_SIGNAL_MAP = [
  {
    term: "security",
    label: "Security operations",
    reason: "Your service background translates strongly into secure operations leadership.",
    recommendation: "Refresh enterprise security governance and incident reporting examples."
  },
  {
    term: "operations",
    label: "Operations planning",
    reason: "The role values structured planning and disciplined execution.",
    recommendation: "Add civilian operations planning outcomes to your resume."
  },
  {
    term: "leadership",
    label: "Leadership",
    reason: "Command and team leadership experience create a strong fit here.",
    recommendation: "Show team scale, mission outcomes, and mentoring impact."
  },
  {
    term: "compliance",
    label: "Compliance",
    reason: "Process discipline and governance awareness support this job well.",
    recommendation: "Take a short governance or compliance certification."
  },
  {
    term: "training",
    label: "Training",
    reason: "Training and coaching experience strengthen this transition path.",
    recommendation: "Highlight onboarding, training, and coaching achievements."
  },
  {
    term: "mentor",
    label: "Mentorship",
    reason: "Mentorship and people development are directly relevant here.",
    recommendation: "Add mentoring stories and workshop facilitation examples."
  },
  {
    term: "logistics",
    label: "Logistics",
    reason: "Logistics coordination experience matches commercial operations roles.",
    recommendation: "Add a supply chain or procurement upskilling module."
  }
];

function includesTerm(source, term) {
  return String(source || "").toLowerCase().includes(term);
}

export function buildCareerInsights(job, resumeText = "") {
  const source = `${job?.title || ""} ${job?.description || ""} ${job?.company || ""}`.toLowerCase();
  const profile = String(resumeText || "").toLowerCase();
  let score = 56;

  const matchedSignals = [];
  const missingSignals = [];

  for (const signal of SKILL_SIGNAL_MAP) {
    const inJob = includesTerm(source, signal.term);
    const inProfile = includesTerm(profile, signal.term);
    if (inJob && inProfile) {
      matchedSignals.push(signal);
      score += 9;
    }
    if (inJob && !inProfile) {
      missingSignals.push(signal);
      score -= 2;
    }
  }

  if (includesTerm(job?.location, "remote")) score += 3;
  if (includesTerm(source, "manager")) score += 2;

  return {
    matchPercent: Math.max(54, Math.min(96, Math.round(score))),
    reason:
      matchedSignals[0]?.reason ||
      "This role aligns with defence-grade discipline, planning, and execution strength.",
    skillGaps: missingSignals.slice(0, 3).map((signal) => signal.label),
    upskilling: missingSignals.slice(0, 2).map((signal) => signal.recommendation)
  };
}

export function enrichClaimProgress(claim) {
  const status = claim?.status || "Submitted";
  const progressPercent =
    status === "Submitted" ? 28 :
    status === "Under Review" ? 64 :
    100;

  return {
    ...claim,
    progressPercent,
    steps: Array.isArray(claim?.steps)
      ? claim.steps
      : [
          { key: "Submitted", label: "Submitted", isCompleted: true, isActive: status === "Submitted" },
          {
            key: "Under Review",
            label: "Under Review",
            isCompleted: ["Under Review", "Approved", "Rejected"].includes(status),
            isActive: status === "Under Review"
          },
          {
            key: "Final",
            label: status === "Rejected" ? "Rejected" : "Approved",
            isCompleted: ["Approved", "Rejected"].includes(status),
            isActive: ["Approved", "Rejected"].includes(status)
          }
        ],
    estimatedProcessingTime:
      claim?.estimatedProcessingTime ||
      (status === "Approved"
        ? "Completed"
        : status === "Rejected"
          ? "Closed"
          : status === "Under Review"
            ? "Estimated 2-4 working days remaining"
            : "Estimated 5-7 working days")
  };
}
