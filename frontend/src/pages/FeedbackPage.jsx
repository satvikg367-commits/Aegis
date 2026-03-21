import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getStatusBadgeClass } from "../utils/status";

const initialForm = { category: "Issue", message: "" };

export default function FeedbackPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiRequest("/feedback", { token });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/feedback", { method: "POST", token, body: form });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section>
        <h1>Feedback & Issue Reporting</h1>
        <p className="subtle">Share platform issues, service feedback, and improvement suggestions.</p>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="grid cards-2">
        <article className="card">
          <h2>Submit Feedback</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option>Issue</option>
                <option>Suggestion</option>
                <option>Service Feedback</option>
                <option>Accessibility</option>
              </select>
            </label>
            <label>
              Message
              <textarea rows={5} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required />
            </label>
            <button type="submit">Submit Feedback Ticket</button>
          </form>
        </article>

        <article className="card">
          <h2>Your Feedback Tickets</h2>
          <ul className="list compact">
            {tickets.length ? tickets.map((ticket) => (
              <li key={ticket.id}>
                <strong>#{ticket.id}</strong> - {ticket.category}
                <div>{ticket.message}</div>
                <div className="subtle">Status: <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>{ticket.status}</span> | {new Date(ticket.createdAt).toLocaleString()}</div>
              </li>
            )) : <li>No feedback submitted yet.</li>}
          </ul>
        </article>
      </section>
    </>
  );
}
