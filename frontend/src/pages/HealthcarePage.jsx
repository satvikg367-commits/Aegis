import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { enrichClaimProgress } from "../utils/insights";
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

function buildDocumentPreview(file) {
  if (!file) return null;
  const isImage = file.type.startsWith("image/");
  return {
    name: file.name,
    sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    typeLabel: file.type || "Document",
    previewUrl: isImage ? URL.createObjectURL(file) : "",
    isImage
  };
}

export default function HealthcarePage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointment);
  const [claimForm, setClaimForm] = useState(initialClaim);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const payload = await apiRequest("/healthcare", { token });
      const providers = Array.isArray(payload?.providers) ? payload.providers : [];
      const claims = Array.isArray(payload?.claims) ? payload.claims.map(enrichClaimProgress) : [];
      setData({
        ...payload,
        providers,
        benefits: Array.isArray(payload?.benefits) ? payload.benefits : [],
        appointments: Array.isArray(payload?.appointments) ? payload.appointments : [],
        claims
      });
      setAppointmentForm((prev) => ({
        ...prev,
        providerId: prev.providerId || String(providers[0]?.id || "")
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    return () => {
      documents.forEach((doc) => {
        if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
      });
    };
  }, [documents]);

  const latestClaim = useMemo(() => data?.claims?.[0] || null, [data]);

  const bookAppointment = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
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
      setMessage("Healthcare appointment booked successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitClaim = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/healthcare/claims", {
        method: "POST",
        token,
        body: {
          ...claimForm,
          documents: documents.map((doc) => ({
            name: doc.name,
            sizeLabel: doc.sizeLabel,
            typeLabel: doc.typeLabel
          }))
        }
      });
      documents.forEach((doc) => {
        if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
      });
      setDocuments([]);
      setClaimForm(initialClaim);
      setMessage("Healthcare claim submitted. You can now track its progress.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    const previews = files.slice(0, 5).map(buildDocumentPreview).filter(Boolean);
    setDocuments(previews);
  };

  const autoFillClaim = () => {
    if (!documents.length) {
      setError("Upload at least one prescription, invoice, or bill to use AI autofill.");
      return;
    }

    const combinedName = documents.map((doc) => doc.name.toLowerCase()).join(" ");
    const detectedType = combinedName.includes("medicine")
      ? "Medicine"
      : combinedName.includes("hospital")
        ? "Hospitalization"
        : combinedName.includes("scan") || combinedName.includes("test")
          ? "Diagnostics"
          : "Consultation";

    const autoAmount = detectedType === "Hospitalization" ? 8450 : detectedType === "Medicine" ? 3250 : 2100;

    setClaimForm({
      claimType: detectedType,
      amount: String(autoAmount),
      remarks: `AI draft created from ${documents.length} uploaded document(s). Please review before submission.`
    });
    setMessage("AI assistance prepared a healthcare claim draft from your uploaded documents.");
    setError("");
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading healthcare services...</div>;

  return (
    <>
      <section className="module-hero">
        <div>
          <div className="section-eyebrow">Healthcare Guidance</div>
          <h1>🏥 Healthcare Services</h1>
          <p className="subtle">Book appointments, auto-draft claims from documents, and track review progress without confusion.</p>
        </div>
        <div className="hero-mini-panel">
          <strong>Current Claim Status</strong>
          {latestClaim ? (
            <>
              <span className={`badge ${getStatusBadgeClass(latestClaim.status)}`}>{latestClaim.status}</span>
              <p className="subtle">{latestClaim.estimatedProcessingTime}</p>
            </>
          ) : (
            <p className="subtle">No active claims yet.</p>
          )}
        </div>
      </section>

      {message && <div className="alert success">{message}</div>}

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">AI Claim Preparation</div>
          <h2>Upload Claim Documents</h2>
          <p className="subtle">Upload prescription, invoice, bill, or discharge summary and let AEGIS prepare a draft.</p>
          <label>
            Supporting Documents
            <input type="file" accept=".pdf,image/*" multiple onChange={onFilesSelected} />
          </label>
          <div className="doc-preview-grid">
            {documents.map((doc) => (
              <article key={`${doc.name}-${doc.sizeLabel}`} className="doc-preview-card">
                {doc.isImage && doc.previewUrl ? <img src={doc.previewUrl} alt={doc.name} /> : <div className="doc-placeholder">PDF</div>}
                <strong>{doc.name}</strong>
                <span className="subtle">{doc.typeLabel} · {doc.sizeLabel}</span>
              </article>
            ))}
          </div>
          <button type="button" onClick={autoFillClaim}>Auto-Fill Claim Form</button>
        </article>

        <article className="card">
          <div className="section-eyebrow">Guided Claim Form</div>
          <h2>File Healthcare Claim</h2>
          <form className="form-grid" onSubmit={submitClaim}>
            <label>
              Claim Type
              <select value={claimForm.claimType} onChange={(event) => setClaimForm((prev) => ({ ...prev, claimType: event.target.value }))}>
                <option>Consultation</option>
                <option>Medicine</option>
                <option>Hospitalization</option>
                <option>Diagnostics</option>
              </select>
            </label>
            <label>
              Amount (INR)
              <input type="number" min="1" step="0.01" value={claimForm.amount} onChange={(event) => setClaimForm((prev) => ({ ...prev, amount: event.target.value }))} required />
            </label>
            <label>
              Remarks
              <textarea rows={4} value={claimForm.remarks} onChange={(event) => setClaimForm((prev) => ({ ...prev, remarks: event.target.value }))} />
            </label>
            <button type="submit">Submit Healthcare Claim</button>
          </form>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">Claim Progress Tracker</div>
          <h2>Recent Claims</h2>
          <div className="claim-card-stack">
            {data.claims.length ? data.claims.map((claim) => (
              <article key={claim.id} className="claim-summary-card">
                <div className="claim-summary-head">
                  <strong>{claim.claimType}</strong>
                  <span className={`badge ${getStatusBadgeClass(claim.status)}`}>{claim.status}</span>
                </div>
                <p>Claim #{claim.id} · INR {Number(claim.amount).toFixed(2)}</p>
                <div className="progress-rail"><span style={{ width: `${claim.progressPercent}%` }} /></div>
                <div className="progress-steps">
                  {claim.steps.map((step) => (
                    <span key={step.key} className={`progress-step ${step.isCompleted ? "done" : ""} ${step.isActive ? "active" : ""}`}>
                      {step.label}
                    </span>
                  ))}
                </div>
                <p className="subtle">{claim.estimatedProcessingTime}</p>
              </article>
            )) : <p>No healthcare claims yet.</p>}
          </div>
        </article>

        <article className="card">
          <div className="section-eyebrow">Benefits & Providers</div>
          <h2>Care Access</h2>
          <ul className="list compact">
            {data.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>

          <h3>Provider Directory</h3>
          <div className="provider-stack">
            {data.providers.map((provider) => (
              <article key={provider.id} className="provider-card">
                <strong>{provider.name}</strong>
                <p>{provider.facilityType} · {provider.specialty}</p>
                <p className="subtle">{provider.city} · {provider.phone}</p>
                <span className={`badge ${provider.telehealthAvailable ? "success" : "warning"}`}>
                  {provider.telehealthAvailable ? "Telehealth Available" : "In-person Only"}
                </span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">Appointment Booking</div>
          <h2>Book Appointment</h2>
          <form className="form-grid" onSubmit={bookAppointment}>
            <label>
              Provider
              <select
                value={appointmentForm.providerId}
                onChange={(event) => setAppointmentForm((prev) => ({ ...prev, providerId: event.target.value }))}
                required
              >
                {data.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.city})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date & Time
              <input
                type="datetime-local"
                value={appointmentForm.appointmentTime}
                onChange={(event) => setAppointmentForm((prev) => ({ ...prev, appointmentTime: event.target.value }))}
                required
              />
            </label>
            <label className="inline-field">
              <input
                type="checkbox"
                checked={appointmentForm.isTelehealth}
                onChange={(event) => setAppointmentForm((prev) => ({ ...prev, isTelehealth: event.target.checked }))}
              />
              Request telehealth consultation
            </label>
            <label>
              Note
              <textarea rows={3} value={appointmentForm.note} onChange={(event) => setAppointmentForm((prev) => ({ ...prev, note: event.target.value }))} />
            </label>
            <button type="submit">Book Healthcare Appointment</button>
          </form>
        </article>

        <article className="card">
          <div className="section-eyebrow">Scheduled Care</div>
          <h2>Your Appointments</h2>
          <ul className="list compact">
            {data.appointments.length ? data.appointments.map((appointment) => (
              <li key={appointment.id}>
                <strong>{appointment.provider?.name || "Provider"}</strong>
                <div>{new Date(appointment.appointmentTime).toLocaleString()}</div>
                <div>
                  <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>{appointment.status}</span>
                  {appointment.isTelehealth && appointment.meetingLink && (
                    <>
                      {" "}
                      <a href={appointment.meetingLink} target="_blank" rel="noreferrer">Join Telehealth</a>
                    </>
                  )}
                </div>
              </li>
            )) : <li>No appointments booked.</li>}
          </ul>
        </article>
      </section>
    </>
  );
}
