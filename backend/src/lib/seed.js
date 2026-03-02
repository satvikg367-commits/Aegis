import bcrypt from "bcryptjs";
import { isoDaysFromNow, nowIso } from "./date.js";

const hash = (value) => bcrypt.hashSync(value, 10);

export function createSeedDatabase() {
  const createdAt = nowIso();

  const users = [
    {
      id: 1,
      fullName: "Col. Arjun Singh (Retd.)",
      email: "retired.officer@example.com",
      phone: "+91-9000000000",
      role: "officer",
      passwordHash: hash("ChangeMe123!"),
      twofaEnabled: false,
      twofaSecret: "",
      isActive: true,
      accessibility: {
        highContrast: false,
        fontScale: 100,
        textToSpeech: false
      },
      notificationPrefs: {
        pension: true,
        healthcare: true,
        career: true,
        community: true
      },
      createdAt
    },
    {
      id: 2,
      fullName: "Portal Admin",
      email: "admin@example.com",
      phone: "+91-9000000001",
      role: "admin",
      passwordHash: hash("Admin@12345"),
      twofaEnabled: false,
      twofaSecret: "",
      isActive: true,
      accessibility: {
        highContrast: false,
        fontScale: 100,
        textToSpeech: false
      },
      notificationPrefs: {
        pension: true,
        healthcare: true,
        career: true,
        community: true
      },
      createdAt
    }
  ];

  const pensionProfiles = [
    {
      id: 1,
      userId: 1,
      pensionId: "PEN-DEF-2020-1188",
      currentAmount: 78000,
      bankAccountLast4: "4321",
      nextPaymentDate: isoDaysFromNow(15)
    }
  ];

  const pensionPayments = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (idx + 1));
    return {
      id: idx + 1,
      userId: 1,
      amount: 78000,
      paymentDate: d.toISOString(),
      status: "Paid",
      note: "Monthly pension credit"
    };
  });

  const pensionRequests = [];

  const pensionExpenses = [
    {
      id: 1,
      userId: 1,
      category: "Utilities",
      amount: 9200,
      expenseDate: isoDaysFromNow(-3),
      note: "Electricity and maintenance bills",
      createdAt
    },
    {
      id: 2,
      userId: 1,
      category: "Healthcare",
      amount: 4800,
      expenseDate: isoDaysFromNow(-7),
      note: "Medicine and consultation",
      createdAt
    },
    {
      id: 3,
      userId: 1,
      category: "Groceries",
      amount: 6500,
      expenseDate: isoDaysFromNow(-10),
      note: "Monthly grocery expenses",
      createdAt
    }
  ];

  const healthcareProviders = [
    {
      id: 1,
      name: "Armed Forces Wellness Hospital",
      facilityType: "Hospital",
      specialty: "Multi-specialty",
      address: "12 Defence Road",
      city: "Delhi",
      phone: "011-10000001",
      telehealthAvailable: true
    },
    {
      id: 2,
      name: "Veterans Cardio Clinic",
      facilityType: "Clinic",
      specialty: "Cardiology",
      address: "44 Central Avenue",
      city: "Pune",
      phone: "020-20000002",
      telehealthAvailable: false
    },
    {
      id: 3,
      name: "Dr. Meera Kapoor",
      facilityType: "Specialist",
      specialty: "Orthopedics",
      address: "9 Medical Park",
      city: "Bengaluru",
      phone: "080-30000003",
      telehealthAvailable: true
    }
  ];

  const appointments = [];

  const healthcareClaims = [];

  const jobPostings = [
    {
      id: 1,
      title: "Security Operations Manager",
      company: "Sentinel Logistics",
      location: "Mumbai",
      employmentType: "Full-time",
      salaryRange: "INR 18-24 LPA",
      description: "Lead corporate security and incident response programs.",
      postedAt: nowIso(),
      isActive: true
    },
    {
      id: 2,
      title: "Administrative Compliance Lead",
      company: "Civic Infrastructure Ltd",
      location: "Delhi",
      employmentType: "Consulting",
      salaryRange: "INR 12-16 LPA",
      description: "Drive policy compliance and operational governance.",
      postedAt: nowIso(),
      isActive: true
    },
    {
      id: 3,
      title: "Training and Leadership Mentor",
      company: "SkillBridge Academy",
      location: "Remote",
      employmentType: "Part-time",
      salaryRange: "INR 7-10 LPA",
      description: "Mentor young professionals on discipline and leadership.",
      postedAt: nowIso(),
      isActive: true
    }
  ];

  const resumes = [];
  const jobApplications = [];

  const workshops = [
    {
      id: 1,
      title: "Transitioning to Civilian Leadership",
      description: "Practical strategies for corporate leadership roles.",
      startTime: isoDaysFromNow(7),
      mode: "Online",
      link: "https://example.org/workshops/leadership-transition"
    },
    {
      id: 2,
      title: "Interview Preparation for Senior Roles",
      description: "Mock sessions and communication guidance.",
      startTime: isoDaysFromNow(12),
      mode: "Hybrid",
      link: "https://example.org/workshops/interview-prep"
    }
  ];

  const forumPosts = [];
  const forumReplies = [];

  const resourceItems = [
    {
      id: 1,
      title: "Retirement Financial Planning Guide",
      category: "Financial Planning",
      contentType: "Guide",
      url: "https://example.org/resources/finance-guide",
      description: "Checklist for budget planning, savings and tax readiness.",
      publishedAt: nowIso()
    },
    {
      id: 2,
      title: "Preventive Healthcare for Veterans",
      category: "Health Management",
      contentType: "Article",
      url: "https://example.org/resources/healthcare-veterans",
      description: "Routine screening schedule and wellness guidance.",
      publishedAt: nowIso()
    },
    {
      id: 3,
      title: "Resume Conversion: Military to Civilian",
      category: "Career Transition",
      contentType: "Video",
      url: "https://example.org/resources/resume-conversion",
      description: "How to map service achievements to civilian job language.",
      publishedAt: nowIso()
    }
  ];

  const notifications = [];
  const feedbackTickets = [];
  const passwordResetTokens = [];

  return {
    meta: {
      initializedAt: createdAt,
      nextIds: {
        users: 3,
        pensionProfiles: 2,
        pensionPayments: 7,
        pensionRequests: 1,
        pensionExpenses: 4,
        healthcareProviders: 4,
        appointments: 1,
        healthcareClaims: 1,
        jobPostings: 4,
        resumes: 1,
        jobApplications: 1,
        workshops: 3,
        forumPosts: 1,
        forumReplies: 1,
        resourceItems: 4,
        notifications: 1,
        feedbackTickets: 1,
        passwordResetTokens: 1
      }
    },
    users,
    pensionProfiles,
    pensionPayments,
    pensionRequests,
    pensionExpenses,
    healthcareProviders,
    appointments,
    healthcareClaims,
    jobPostings,
    resumes,
    jobApplications,
    workshops,
    forumPosts,
    forumReplies,
    resourceItems,
    notifications,
    feedbackTickets,
    passwordResetTokens
  };
}
