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
        csd: true
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
        csd: true
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

  const pensionRequests = [
    {
      id: 1,
      userId: 1,
      requestType: "Life Certificate Issue",
      details: "Need verification for delayed update in pension disbursal records.",
      status: "Under Review",
      createdAt: isoDaysFromNow(-11),
      updatedAt: isoDaysFromNow(-6)
    },
    {
      id: 2,
      userId: 1,
      requestType: "Bank Account Update",
      details: "Primary bank branch migrated. Requesting account update confirmation.",
      status: "Submitted",
      createdAt: isoDaysFromNow(-4),
      updatedAt: isoDaysFromNow(-4)
    },
    {
      id: 3,
      userId: 1,
      requestType: "Nominee Correction",
      details: "Nominee relationship metadata corrected and supporting document uploaded.",
      status: "Approved",
      createdAt: isoDaysFromNow(-26),
      updatedAt: isoDaysFromNow(-20)
    }
  ];

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

  const appointments = [
    {
      id: 1,
      userId: 1,
      providerId: 1,
      appointmentTime: isoDaysFromNow(3),
      status: "Booked",
      isTelehealth: true,
      meetingLink: "https://telehealth.example.org/session/1-1",
      note: "Follow-up for blood pressure and routine review."
    },
    {
      id: 2,
      userId: 1,
      providerId: 3,
      appointmentTime: isoDaysFromNow(-5),
      status: "Completed",
      isTelehealth: false,
      meetingLink: "",
      note: "Orthopedic consultation completed successfully."
    }
  ];

  const healthcareClaims = [
    {
      id: 1,
      userId: 1,
      claimType: "Medicine",
      amount: 3200,
      status: "Under Review",
      remarks: "Prescription and invoice attached.",
      submittedAt: isoDaysFromNow(-6)
    },
    {
      id: 2,
      userId: 1,
      claimType: "Consultation",
      amount: 1800,
      status: "Approved",
      remarks: "Processed under veteran coverage plan.",
      submittedAt: isoDaysFromNow(-19)
    }
  ];

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

  const resumes = [
    {
      id: 1,
      userId: 1,
      summary: "Retired defence officer with 24+ years of operational and leadership command experience.",
      skills: "Security operations, compliance, team leadership, crisis response, training",
      experience: "Led multi-unit operations, logistics coordination, and inter-agency security drills.",
      updatedAt: isoDaysFromNow(-2)
    }
  ];
  const jobApplications = [
    {
      id: 1,
      userId: 1,
      jobId: 1,
      status: "Interview Scheduled",
      appliedAt: isoDaysFromNow(-5)
    },
    {
      id: 2,
      userId: 1,
      jobId: 2,
      status: "Applied",
      appliedAt: isoDaysFromNow(-2)
    }
  ];

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

  const csdProducts = [
    {
      id: 1,
      category: "Grocery",
      name: "Family Grocery Kit",
      description: "Monthly essentials pack with grains, oil, and pantry basics.",
      mrp: 3650,
      subsidizedPrice: 2980,
      stockStatus: "In Stock",
      isPopular: true,
      isActive: true,
      popularityScore: 92,
      benefitLabel: "Defence Subsidy Applied"
    },
    {
      id: 2,
      category: "Electronics",
      name: "Smart Induction Cooktop",
      description: "Energy-efficient cooktop with defence canteen pricing.",
      mrp: 4200,
      subsidizedPrice: 3390,
      stockStatus: "In Stock",
      isPopular: true,
      isActive: true,
      popularityScore: 81,
      benefitLabel: "CSD Electronics Benefit"
    },
    {
      id: 3,
      category: "Essentials",
      name: "Wellness Essentials Pack",
      description: "Daily living and personal care essentials for veterans.",
      mrp: 2100,
      subsidizedPrice: 1650,
      stockStatus: "In Stock",
      isPopular: true,
      isActive: true,
      popularityScore: 77,
      benefitLabel: "Priority Subsidized Pricing"
    },
    {
      id: 4,
      category: "Electronics",
      name: "Defence Secure Feature Phone",
      description: "Simple large-button phone suitable for senior-friendly use.",
      mrp: 3100,
      subsidizedPrice: 2490,
      stockStatus: "Low Stock",
      isPopular: false,
      isActive: true,
      popularityScore: 63,
      benefitLabel: "Senior Friendly Support"
    }
  ];

  const csdOrders = [
    {
      id: 1,
      userId: 1,
      orderNumber: "CSD-240301-118",
      status: "Delivered",
      createdAt: isoDaysFromNow(-11),
      estimatedDelivery: isoDaysFromNow(-7),
      totalAmount: 2980,
      totalSavings: 670,
      items: [
        {
          productId: 1,
          name: "Family Grocery Kit",
          quantity: 1,
          subsidizedPrice: 2980,
          mrp: 3650
        }
      ]
    },
    {
      id: 2,
      userId: 1,
      orderNumber: "CSD-240314-224",
      status: "Processing",
      createdAt: isoDaysFromNow(-2),
      estimatedDelivery: isoDaysFromNow(3),
      totalAmount: 5040,
      totalSavings: 1260,
      items: [
        {
          productId: 2,
          name: "Smart Induction Cooktop",
          quantity: 1,
          subsidizedPrice: 3390,
          mrp: 4200
        },
        {
          productId: 3,
          name: "Wellness Essentials Pack",
          quantity: 1,
          subsidizedPrice: 1650,
          mrp: 2100
        }
      ]
    }
  ];

  const forumPosts = [
    {
      id: 1,
      userId: 1,
      title: "Tips for managing monthly pension expenses",
      content: "Sharing a budgeting template that helped me track fixed vs variable costs each month.",
      category: "Pension",
      isFlagged: false,
      isLocked: false,
      createdAt: isoDaysFromNow(-7)
    },
    {
      id: 2,
      userId: 2,
      title: "Healthcare claim processing time experiences",
      content: "Please share your average claim turnaround and any document checklist suggestions.",
      category: "Healthcare",
      isFlagged: false,
      isLocked: false,
      createdAt: isoDaysFromNow(-3)
    }
  ];
  const forumReplies = [
    {
      id: 1,
      postId: 1,
      userId: 2,
      content: "Great approach. I also split expenses into essentials and discretionary categories.",
      isFlagged: false,
      createdAt: isoDaysFromNow(-6)
    },
    {
      id: 2,
      postId: 1,
      userId: 1,
      content: "Thanks. Happy to share the spreadsheet format in the next post.",
      isFlagged: false,
      createdAt: isoDaysFromNow(-5)
    },
    {
      id: 3,
      postId: 2,
      userId: 1,
      content: "My last claim was approved in 8 days after uploading complete prescriptions and bills.",
      isFlagged: false,
      createdAt: isoDaysFromNow(-2)
    }
  ];

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

  const notifications = [
    {
      id: 1,
      userId: 1,
      category: "Pension",
      title: "Upcoming pension credit",
      message: "Your pension is expected to be credited in 2 days.",
      isRead: false,
      createdAt: isoDaysFromNow(-1)
    },
    {
      id: 2,
      userId: 1,
      category: "Career",
      title: "New matching job role",
      message: "Security Operations Manager role matches your profile at 86%.",
      isRead: false,
      createdAt: isoDaysFromNow(-1)
    },
    {
      id: 3,
      userId: 1,
      category: "Healthcare",
      title: "Appointment reminder",
      message: "Telehealth appointment is scheduled for the next 3 days.",
      isRead: false,
      createdAt: nowIso()
    },
    {
      id: 4,
      userId: 1,
      category: "Community",
      title: "New forum reply",
      message: "A new reply was posted on your pension budgeting discussion.",
      isRead: true,
      createdAt: isoDaysFromNow(-4)
    },
    {
      id: 5,
      userId: 1,
      category: "Pension",
      title: "Request update",
      message: "Nominee correction request has been approved.",
      isRead: true,
      createdAt: isoDaysFromNow(-9)
    },
    {
      id: 6,
      userId: 1,
      category: "Healthcare",
      title: "Claim status changed",
      message: "Consultation claim #2 was approved.",
      isRead: true,
      createdAt: isoDaysFromNow(-18)
    },
    {
      id: 7,
      userId: 1,
      category: "CSD",
      title: "CSD order processing",
      message: "Order CSD-240314-224 is being packed and will arrive in 3 days.",
      isRead: false,
      createdAt: isoDaysFromNow(-1)
    }
  ];
  const feedbackTickets = [
    {
      id: 1,
      userId: 1,
      category: "Suggestion",
      message: "Please add downloadable monthly pension expense reports.",
      status: "In Review",
      createdAt: isoDaysFromNow(-8)
    }
  ];
  const passwordResetTokens = [];

  return {
    meta: {
      initializedAt: createdAt,
      nextIds: {
        users: 3,
        pensionProfiles: 2,
        pensionPayments: 7,
        pensionRequests: 4,
        pensionExpenses: 4,
        healthcareProviders: 4,
        appointments: 3,
        healthcareClaims: 3,
        jobPostings: 4,
        resumes: 2,
        jobApplications: 3,
        workshops: 3,
        csdProducts: 5,
        csdOrders: 3,
        forumPosts: 3,
        forumReplies: 4,
        resourceItems: 4,
        notifications: 8,
        feedbackTickets: 2,
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
    csdProducts,
    csdOrders,
    forumPosts,
    forumReplies,
    resourceItems,
    notifications,
    feedbackTickets,
    passwordResetTokens
  };
}
