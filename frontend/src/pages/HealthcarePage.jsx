import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getStatusBadgeClass } from "../utils/status";

const initialAppointment = {
  providerId: "",
  appointmentTime: "",
  isTelehealth: false,
  note: ""
};

const initialClaim = {
  claimType: "Consultation",
  amount: "",
  remarks: ""
};

export default function HealthcarePage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointment);
  const [claimForm, setClaimForm] = useState(initialClaim);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const payload = await apiRequest("/healthcare", { token });
      setData(payload);
      setAppointmentForm((prev) => ({
        ...prev,
        providerId: prev.providerId || String(payload.providers[0]?.id || "")
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const bookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/healthcare/appointments", {
        method: "POST",
        token,
        body: {
          ...appointmentForm,
          providerId: Number(appointmentForm.providerId)
        }
      });
      setAppointmentForm((prev) => ({ ...initialAppointment, providerId: prev.providerId }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/healthcare/claims", {
        method: "POST",
        token,
        body: claimForm
      });
      setClaimForm(initialClaim);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading healthcare services...</div>;

  return (
    <>
      <section>
        <h1>Healthcare Services</h1>
        <p className="subtle">Provider directory, appointments, telehealth, and claims management.</p>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Book Appointment</h2>
          <form className="form-grid" onSubmit={bookAppointment}>
            <label>
              Provider
              <select
                value={appointmentForm.providerId}
                onChange={(e) => setAppointmentForm((p) => ({ ...p, providerId: e.target.value }))}
                required
              >
                {data.providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.facilityType}, {p.city})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date & Time
              <input
                type="datetime-local"
                value={appointmentForm.appointmentTime}
                onChange={(e) => setAppointmentForm((p) => ({ ...p, appointmentTime: e.target.value }))}
                required
              />
            </label>
            <label className="inline-field">
              <input
                type="checkbox"
                checked={appointmentForm.isTelehealth}
                onChange={(e) => setAppointmentForm((p) => ({ ...p, isTelehealth: e.target.checked }))}
              />
              Request telehealth
            </label>
            <label>
              Note
              <textarea rows={3} value={appointmentForm.note} onChange={(e) => setAppointmentForm((p) => ({ ...p, note: e.target.value }))} />
            </label>
            <button type="submit">Book Healthcare Appointment</button>
          </form>
        </article>

        <article className="card">
          <h2>Benefits & Coverage</h2>
          <ul className="list compact">
            {data.benefits.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Provider Directory</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Specialty</th>
                <th>Location</th>
                <th>Telehealth</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {data.providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.facilityType}</td>
                  <td>{p.specialty}</td>
                  <td>{p.city} - {p.address}</td>
                  <td>{p.telehealthAvailable ? "Yes" : "No"}</td>
                  <td>{p.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Appointments</h2>
          <ul className="list compact">
            {data.appointments.length ? data.appointments.map((a) => (
              <li key={a.id}>
                <strong>{a.provider?.name || "Provider"}</strong> - {new Date(a.appointmentTime).toLocaleString()}<br />
                Status: <span className={`badge ${getStatusBadgeClass(a.status)}`}>{a.status}</span>
                {a.isTelehealth && a.meetingLink && (
                  <>
                    {" "}| <a href={a.meetingLink} target="_blank" rel="noreferrer">Telehealth Link</a>
                  </>
                )}
              </li>
            )) : <li>No appointments booked.</li>}
          </ul>
        </article>

        <article className="card">
          <h2>Submit Claim</h2>
          <form className="form-grid" onSubmit={submitClaim}>
            <label>
              Claim Type
              <select value={claimForm.claimType} onChange={(e) => setClaimForm((p) => ({ ...p, claimType: e.target.value }))}>
                <option>Consultation</option>
                <option>Medicine</option>
                <option>Hospitalization</option>
                <option>Diagnostics</option>
              </select>
            </label>
            <label>
              Amount (INR)
              <input type="number" min="1" step="0.01" value={claimForm.amount} onChange={(e) => setClaimForm((p) => ({ ...p, amount: e.target.value }))} required />
            </label>
            <label>
              Remarks
              <textarea rows={3} value={claimForm.remarks} onChange={(e) => setClaimForm((p) => ({ ...p, remarks: e.target.value }))} />
            </label>
            <button type="submit">Submit Healthcare Claim</button>
          </form>

          <h3>Claim History</h3>
          <ul className="list compact">
            {data.claims.length ? data.claims.map((c) => (
              <li key={c.id}>
                #{c.id} - {c.claimType} - INR {Number(c.amount).toFixed(2)}
                <div>Status: <span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status}</span></div>
              </li>
            )) : <li>No claims submitted.</li>}
          </ul>
        </article>
      </section>
    </>
  );
}
