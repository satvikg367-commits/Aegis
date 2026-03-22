import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getStatusBadgeClass } from "../utils/status";

const ThreeScene = lazy(() => import("../components/ThreeScene"));

const coreServices = [
  {
    icon: "🪖",
    title: "Pension Management",
    description: "Track payments, raise requests, and manage monthly expenses in one workflow."
  },
  {
    icon: "🏥",
    title: "Healthcare Services",
    description: "Book appointments, manage claims, and access verified providers."
  },
  {
    icon: "💼",
    title: "Career Transition",
    description: "Build resumes, discover suitable jobs, and join transition workshops."
  },
  {
    icon: "🔔",
    title: "Alerts & Communication",
    description: "Stay updated with pension, healthcare, career, and community notifications."
  }
];

const demoFlowSteps = [
  {
    step: "01",
    title: "Pension Action",
    description: "Raise and track a pension request in under 30 seconds.",
    path: "/pension",
    actionLabel: "Open Pension"
  },
  {
    step: "02",
    title: "Healthcare Booking",
    description: "Book an appointment and review claim status.",
    path: "/healthcare",
    actionLabel: "Open Healthcare"
  },
  {
    step: "03",
    title: "Career Match",
    description: "View suggested jobs and show resume preview.",
    path: "/career",
    actionLabel: "Open Career"
  },
  {
    step: "04",
    title: "Alerts Review",
    description: "Check urgent notifications and close pending items.",
    path: "/notifications",
    actionLabel: "Open Alerts"
  }
];

function daysUntil(dateIso) {
  if (!dateIso) return null;
  const ts = new Date(dateIso).getTime();
  if (Number.isNaN(ts)) return null;
  const diff = ts - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const enableThreeEffects =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168."));

  useEffect(() => {
    apiRequest("/dashboard/overview", { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading dashboard...</div>;

  const upcomingAppointments = Array.isArray(data?.upcomingAppointments) ? data.upcomingAppointments : [];
  const recommendedJobs = Array.isArray(data?.recommendedJobs) ? data.recommendedJobs : [];
  const recentNotifications = Array.isArray(data?.recentNotifications) ? data.recentNotifications : [];
  const activeRequests = Number(data?.activeRequests || 0);
  const unreadNotifications = Number(data?.unreadNotifications || 0);
  const daysToPayment = daysUntil(data?.pensionProfile?.nextPaymentDate);
  const urgentAlerts = recentNotifications.filter((n) => !n.isRead).slice(0, 3);
  const pensionStatus = activeRequests > 0 ? "Action Pending" : "On Track";
  const readinessScore = Math.min(
    99,
    [
      data.pensionProfile ? 28 : 0,
      data.latestPayment ? 16 : 0,
      upcomingAppointments.length ? 16 : 8,
      recommendedJobs.length ? 16 : 6,
      urgentAlerts.length ? 10 : 14,
      activeRequests === 0 ? 13 : 8
    ].reduce((total, value) => total + value, 0)
  );
  const readinessTone = readinessScore >= 85 ? "success" : readinessScore >= 70 ? "warning" : "danger";
  const readinessAngle = `${Math.round((readinessScore / 100) * 360)}deg`;

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <h1>AEGIS - A unified digital platform for retired defence officers to manage pension, healthcare, and re-employment in one place.</h1>
          <p className="subtle">Simplifying post-service life with secure, centralized access to essential services.</p>
          <p className="subtle"><strong>Welcome back:</strong> {user?.fullName}</p>
          <div className="hero-badges">
            <span className="hero-badge">Secure Unified Access</span>
            <span className="hero-badge">Realtime Service Tracking</span>
            <span className="hero-badge">Career Transition Support</span>
          </div>
        </div>
        <div className="dashboard-hero-visual">
          {enableThreeEffects ? (
            <Suspense fallback={<div className="dashboard-three-fallback" aria-hidden="true" />}>
              <ThreeScene mode="hero" className="dashboard-three-scene" />
            </Suspense>
          ) : (
            <div className="dashboard-three-fallback" aria-hidden="true" />
          )}
          <div className="hero-core hero-core-overlay">
            <strong>AEGIS</strong>
            <span>Mission Ready</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Core Services</h2>
        <div className="grid cards-4 core-services-grid">
          {coreServices.map((service) => (
            <article key={service.title} className="card service-card">
              <div className="service-icon" aria-hidden="true">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid cards-2">
        <article className="card judge-demo-card">
          <h2>Judge Demo Flow</h2>
          <p className="subtle">Use this sequence for a clean 90-second walkthrough.</p>
          <div className="demo-flow-grid">
            {demoFlowSteps.map((step) => (
              <article key={step.step} className="demo-step-card">
                <span className="demo-step-index">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <Link to={step.path} className="demo-step-link">{step.actionLabel}</Link>
              </article>
            ))}
          </div>
        </article>

        <article className="card readiness-card">
          <h2>Mission Readiness</h2>
          <div className="readiness-layout">
            <div className="readiness-gauge" style={{ "--readiness-angle": readinessAngle }}>
              <span>{readinessScore}%</span>
            </div>
            <div>
              <p>
                Current platform readiness:{" "}
                <span className={`badge ${readinessTone}`}>{readinessScore >= 85 ? "High" : readinessScore >= 70 ? "Stable" : "Needs Attention"}</span>
              </p>
              <ul className="list compact">
                <li>Pension profile and payment visibility are active.</li>
                <li>Healthcare, career, and alerts are connected in one workflow.</li>
                <li>Action statuses are visible across requests, bookings, and applications.</li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="grid cards-3">
        <article className="card priority-card">
          <h2>Pension Status</h2>
          <p>
            <strong>Status:</strong>{" "}
            <span className={`badge ${getStatusBadgeClass(pensionStatus)}`}>{pensionStatus}</span>
          </p>
          <p><strong>Pension ID:</strong> {data.pensionProfile?.pensionId || "Not available"}</p>
          <p><strong>Current Monthly Pension:</strong> INR {Number(data.pensionProfile?.currentAmount || 0).toFixed(2)}</p>
          <p><strong>Active Pension Requests:</strong> {activeRequests}</p>
        </article>

        <article className="card priority-card">
          <h2>Upcoming Payment</h2>
          {data.pensionProfile ? (
            <>
              <p><strong>Expected Date:</strong> {new Date(data.pensionProfile.nextPaymentDate).toLocaleDateString()}</p>
              <p>
                <strong>ETA:</strong>{" "}
                {daysToPayment === null ? "Not available" : daysToPayment < 0 ? "Date passed" : `${daysToPayment} day(s)`}
              </p>
              <p><strong>Last Credit:</strong> {data.latestPayment ? `INR ${Number(data.latestPayment.amount).toFixed(2)} on ${new Date(data.latestPayment.paymentDate).toLocaleDateString()}` : "No recent payment found"}</p>
            </>
          ) : (
            <p>Pension profile not linked yet.</p>
          )}
        </article>

        <article className="card priority-card">
          <h2>Urgent Alerts</h2>
          {urgentAlerts.length ? (
            <ul className="list compact">
              {urgentAlerts.map((alert) => (
                <li key={alert.id}>
                  <strong>[{alert.category}]</strong> {alert.title}
                  <div className="subtle">{alert.message}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No urgent alerts right now.</p>
          )}
          <p className="subtle">Unread notifications: {unreadNotifications}</p>
        </article>
      </section>

      <section className="grid cards-4">
        <article className="card">
          <h2>Healthcare Priority</h2>
          <p><strong>Upcoming Appointments:</strong> {upcomingAppointments.length}</p>
          <p><strong>Next Appointment:</strong> {upcomingAppointments[0] ? `${upcomingAppointments[0].provider?.name || "Provider"} on ${new Date(upcomingAppointments[0].appointmentTime).toLocaleDateString()}` : "No appointment scheduled"}</p>
          <p className="subtle">Book or reschedule from Healthcare module.</p>
        </article>

        <article className="card">
          <h2>Career Opportunities</h2>
          <p><strong>Suggested Jobs:</strong> {recommendedJobs.length}</p>
          <ul className="list compact">
            {recommendedJobs.length ? recommendedJobs.slice(0, 2).map((job) => (
              <li key={job.id}><strong>{job.title}</strong> at {job.company}</li>
            )) : <li>No recommendations available.</li>}
          </ul>
        </article>

        <article className="card">
          <h2>Community Pulse</h2>
          <p><strong>Recent Community Alerts:</strong> {recentNotifications.filter((n) => n.category === "Community").length}</p>
          <p className="subtle">Connect with peers and experts in the Community forum.</p>
        </article>

        <article className="card">
          <h2>Smart Assistance</h2>
          <ul className="list compact">
            <li>Your pension will be credited in {daysToPayment === null ? "N/A" : `${Math.max(daysToPayment, 0)} day(s)`}.</li>
            <li>New job roles are matched to leadership and security experience.</li>
            <li>Healthcare claims and appointments can be tracked in one place.</li>
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Recent Notifications</h2>
        <ul className="list compact">
          {recentNotifications.length ? (
            recentNotifications.map((n) => (
              <li key={n.id}>
                <strong>[{n.category}]</strong> {n.title}
                <div className="subtle">{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))
          ) : (
            <li>No notifications yet.</li>
          )}
        </ul>
      </section>

      <section className="card impact-card">
        <h2>Why AEGIS Matters</h2>
        <ul className="list compact">
          <li>Reduces dependency on multiple disconnected systems.</li>
          <li>Saves time for retired officers with one secure workflow.</li>
          <li>Improves access to healthcare, pension support, and re-employment.</li>
          <li>Digitizes fragmented services into a single mission-ready platform.</li>
        </ul>
      </section>
    </>
  );
}
