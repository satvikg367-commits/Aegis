import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const emptyResume = { summary: "", skills: "", experience: "" };

export default function CareerPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [resume, setResume] = useState(emptyResume);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const payload = await apiRequest("/career", { token });
      setData(payload);
      if (payload.latestResume) {
        setResume({
          summary: payload.latestResume.summary,
          skills: payload.latestResume.skills,
          experience: payload.latestResume.experience
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const saveResume = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/career/resume", { method: "PUT", token, body: resume });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const apply = async (jobId) => {
    setError("");
    try {
      await apiRequest("/career/apply", { method: "POST", token, body: { jobId } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading career module...</div>;

  const applied = new Set(data.applications.map((a) => a.jobId));

  return (
    <>
      <section>
        <h1>Career Development & Re-employment</h1>
        <p className="subtle">Build your resume, explore civilian opportunities, and join workshops.</p>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Resume Builder</h2>
          <form className="form-grid" onSubmit={saveResume}>
            <label>
              Professional Summary
              <textarea rows={4} value={resume.summary} onChange={(e) => setResume((p) => ({ ...p, summary: e.target.value }))} required />
            </label>
            <label>
              Key Skills
              <textarea rows={3} value={resume.skills} onChange={(e) => setResume((p) => ({ ...p, skills: e.target.value }))} required />
            </label>
            <label>
              Experience Highlights
              <textarea rows={4} value={resume.experience} onChange={(e) => setResume((p) => ({ ...p, experience: e.target.value }))} required />
            </label>
            <button type="submit">Save Resume</button>
          </form>
        </article>

        <article className="card">
          <h2>Workshops & Webinars</h2>
          <ul className="list compact">
            {data.workshops.length ? data.workshops.map((w) => (
              <li key={w.id}>
                <strong>{w.title}</strong><br />
                {new Date(w.startTime).toLocaleString()} | {w.mode}
                {w.link && (
                  <>
                    <br />
                    <a href={w.link} target="_blank" rel="noreferrer">Join/Details</a>
                  </>
                )}
              </li>
            )) : <li>No upcoming workshops.</li>}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Job Board</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Company</th>
                <th>Location</th>
                <th>Type</th>
                <th>Compensation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.length ? data.jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <div className="subtle">{job.description}</div>
                  </td>
                  <td>{job.company}</td>
                  <td>{job.location}</td>
                  <td>{job.employmentType}</td>
                  <td>{job.salaryRange}</td>
                  <td>
                    {applied.has(job.id) ? (
                      <span className="badge success">Applied</span>
                    ) : (
                      <button type="button" onClick={() => apply(job.id)}>Apply</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No job postings available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Application Tracker</h2>
        <ul className="list compact">
          {data.applications.length ? data.applications.map((app) => (
            <li key={app.id}>
              <strong>{app.job?.title || "Job"}</strong> at {app.job?.company || "Company"}
              <div>Status: <span className="badge warning">{app.status}</span> | Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
            </li>
          )) : <li>No applications submitted yet.</li>}
        </ul>
      </section>
    </>
  );
}
