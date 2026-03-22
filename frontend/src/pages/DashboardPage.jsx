import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { enrichClaimProgress } from "../utils/insights";
import { getStatusBadgeClass } from "../utils/status";

const quickActions = [
  { icon: "🏥", title: "File a Healthcare Claim", path: "/healthcare", description: "Upload documents and submit a claim draft fast." },
  { icon: "🪖", title: "Check Pension", path: "/pension", description: "Review payout status and next pension date." },
  { icon: "💼", title: "Explore Jobs", path: "/career", description: "See personalized civilian job matches." },
  { icon: "🛒", title: "Order from CSD", path: "/csd", description: "Access subsidized products and repeat recent orders." }
];

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/dashboard/overview", { token })
      .then((payload) => {
        setData({
          pension: payload?.pension || {},
          recentClaims: Array.isArray(payload?.recentClaims) ? payload.recentClaims.map(enrichClaimProgress) : [],
          jobRecommendations: Array.isArray(payload?.jobRecommendations) ? payload.jobRecommendations : [],
          csdQuickAccess: payload?.csdQuickAccess || { recentOrders: [], popularItems: [] },
          notificationSummary: payload?.notificationSummary || { unreadCount: 0, items: [] }
        });
      })
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading central dashboard...</div>;

  const quickCsdItems = data.csdQuickAccess.recentOrders?.length
    ? data.csdQuickAccess.recentOrders
    : data.csdQuickAccess.popularItems;

  return (
    <>
      <section className="mission-dashboard">
        <div className="mission-dashboard-copy">
          <div className="section-eyebrow">Unified Assistance Dashboard</div>
          <h1>Welcome back, {user?.fullName?.split(" ")[0] || "Officer"}.</h1>
          <p className="subtle">
            AEGIS brings pension, healthcare, career transition, and CSD services into one guided command center.
          </p>
          <div className="hero-badges">
            <span className="hero-badge">Secure Verified Access</span>
            <span className="hero-badge">Smart Assistance Active</span>
            <span className="hero-badge">Retiree-First Design</span>
          </div>
        </div>
        <div className="mission-trust-panel">
          <div className="trust-highlight">
            <strong>Trusted & Protected</strong>
            <p>Session encrypted, account verified, and key actions tracked for reliability.</p>
          </div>
          <ul className="list compact">
            <li>Secure pension and healthcare records</li>
            <li>Verified service workflows</li>
            <li>Reliable reminders and status updates</li>
          </ul>
        </div>
      </section>

      <section className="dashboard-actions-grid">
        {quickActions.map((action) => (
          <article key={action.title} className="card action-card">
            <div className="service-icon" aria-hidden="true">{action.icon}</div>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <Link to={action.path} className="demo-step-link">Open</Link>
          </article>
        ))}
      </section>

      <section className="grid cards-2 dashboard-primary-grid">
        <article className="card spotlight-card">
          <div className="section-eyebrow">Pension Overview</div>
          <h2>🪖 Pension Status</h2>
          <p>
            <span className={`badge ${getStatusBadgeClass(data.pension.status)}`}>{data.pension.status || "On Track"}</span>
          </p>
          <p><strong>Next Payment Date:</strong> {data.pension.profile?.nextPaymentDate ? new Date(data.pension.profile.nextPaymentDate).toLocaleDateString() : "Not available"}</p>
          <p><strong>Monthly Pension:</strong> INR {Number(data.pension.profile?.currentAmount || 0).toFixed(2)}</p>
          <p><strong>Active Requests:</strong> {Number(data.pension.activeRequests || 0)}</p>
          {data.pension.latestPayment && (
            <p className="subtle">
              Last credited: INR {Number(data.pension.latestPayment.amount).toFixed(2)} on {new Date(data.pension.latestPayment.paymentDate).toLocaleDateString()}
            </p>
          )}
        </article>

        <article className="card spotlight-card">
          <div className="section-eyebrow">Notifications Summary</div>
          <h2>🔔 Important Notifications</h2>
          <p><strong>Unread Alerts:</strong> {Number(data.notificationSummary.unreadCount || 0)}</p>
          <ul className="list compact">
            {(data.notificationSummary.items || []).slice(0, 4).map((item) => (
              <li key={item.id}>
                <strong>[{item.category}]</strong> {item.title}
                <div className="subtle">{item.message}</div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">Healthcare Claim Tracker</div>
          <h2>🏥 Recent Healthcare Claims</h2>
          <div className="claim-card-stack">
            {data.recentClaims.length ? data.recentClaims.map((claim) => (
              <article key={claim.id} className="claim-summary-card">
                <div className="claim-summary-head">
                  <strong>{claim.claimType}</strong>
                  <span className={`badge ${getStatusBadgeClass(claim.status)}`}>{claim.status}</span>
                </div>
                <p>Claim #{claim.id} · INR {Number(claim.amount).toFixed(2)}</p>
                <div className="progress-rail"><span style={{ width: `${claim.progressPercent}%` }} /></div>
                <p className="subtle">{claim.estimatedProcessingTime}</p>
              </article>
            )) : <p>No healthcare claims yet.</p>}
          </div>
        </article>

        <article className="card">
          <div className="section-eyebrow">Career Recommendations</div>
          <h2>💼 Top 2 Job Matches</h2>
          <div className="job-reco-stack">
            {data.jobRecommendations.length ? data.jobRecommendations.map((job) => (
              <article key={job.id} className="job-reco-card">
                <div className="claim-summary-head">
                  <strong>{job.title}</strong>
                  <span className={`badge ${job.matchPercent >= 80 ? "success" : "warning"}`}>{job.matchPercent}% Match</span>
                </div>
                <p>{job.company} · {job.location}</p>
                <p className="subtle">{job.reason}</p>
              </article>
            )) : <p>No job recommendations available.</p>}
          </div>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">CSD Quick Access</div>
          <h2>🛒 CSD Essentials</h2>
          {quickCsdItems?.length ? (
            <div className="product-grid compact-products">
              {quickCsdItems.slice(0, 2).map((item) => (
                <article key={item.id || item.orderNumber} className="product-card compact">
                  {"orderNumber" in item ? (
                    <>
                      <strong>{item.orderNumber}</strong>
                      <p>Status: <span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></p>
                      <p className="subtle">Savings INR {Number(item.totalSavings || 0).toFixed(0)}</p>
                    </>
                  ) : (
                    <>
                      <strong>{item.name}</strong>
                      <p>INR {Number(item.subsidizedPrice).toFixed(0)}</p>
                      <p className="subtle">{item.benefitLabel}</p>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p>No CSD activity yet.</p>
          )}
          <Link to="/csd" className="demo-step-link">Go to CSD</Link>
        </article>

        <article className="card">
          <div className="section-eyebrow">Smart Guidance</div>
          <h2>🤖 Assistant Highlights</h2>
          <ul className="list compact">
            <li>Ask about pension status and next payment date</li>
            <li>Get guided healthcare claim filing steps</li>
            <li>See personalized job suggestions with reasons</li>
            <li>Check eligible CSD products and order reminders</li>
          </ul>
          <p className="subtle">Use the floating Smart Assist button from any portal page.</p>
        </article>
      </section>
    </>
  );
}
