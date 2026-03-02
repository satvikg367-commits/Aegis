import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/dashboard/overview", { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading dashboard...</div>;

  return (
    <>
      <section>
        <h1>Welcome, {user?.fullName}</h1>
        <p className="subtle">Your central dashboard for pension, healthcare, career, and community updates.</p>
      </section>

      <section className="grid cards-4">
        <article className="card">
          <h2>Pension Snapshot</h2>
          {data.pensionProfile ? (
            <>
              <p><strong>ID:</strong> {data.pensionProfile.pensionId}</p>
              <p><strong>Amount:</strong> INR {Number(data.pensionProfile.currentAmount).toFixed(2)}</p>
              <p><strong>Next Payment:</strong> {new Date(data.pensionProfile.nextPaymentDate).toLocaleDateString()}</p>
            </>
          ) : (
            <p>No pension profile available.</p>
          )}
        </article>

        <article className="card">
          <h2>Last Payment</h2>
          {data.latestPayment ? (
            <>
              <p><strong>Date:</strong> {new Date(data.latestPayment.paymentDate).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> INR {Number(data.latestPayment.amount).toFixed(2)}</p>
              <p><strong>Status:</strong> {data.latestPayment.status}</p>
            </>
          ) : (
            <p>No payments yet.</p>
          )}
        </article>

        <article className="card">
          <h2>Active Requests</h2>
          <p className="metric">{data.activeRequests}</p>
          <p>Pension cases currently in processing.</p>
        </article>

        <article className="card">
          <h2>Unread Alerts</h2>
          <p className="metric">{data.unreadNotifications}</p>
          <p>Check notification center for updates.</p>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Upcoming Appointments</h2>
          <ul className="list compact">
            {data.upcomingAppointments.length ? (
              data.upcomingAppointments.map((appt) => (
                <li key={appt.id}>
                  <strong>{appt.provider?.name || "Provider"}</strong><br />
                  {new Date(appt.appointmentTime).toLocaleString()}
                  {appt.isTelehealth && <span className="badge"> Telehealth</span>}
                </li>
              ))
            ) : (
              <li>No upcoming appointments.</li>
            )}
          </ul>
        </article>

        <article className="card">
          <h2>Recommended Jobs</h2>
          <ul className="list compact">
            {data.recommendedJobs.length ? (
              data.recommendedJobs.map((job) => (
                <li key={job.id}>
                  <strong>{job.title}</strong> - {job.company}<br />
                  {job.location} | {job.employmentType}
                </li>
              ))
            ) : (
              <li>No job recommendations.</li>
            )}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Recent Notifications</h2>
        <ul className="list compact">
          {data.recentNotifications.length ? (
            data.recentNotifications.map((n) => (
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
    </>
  );
}
