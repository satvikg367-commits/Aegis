import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { buildCareerInsights } from "../utils/insights";
import { getStatusBadgeClass } from "../utils/status";

const emptyResume = { summary: "", skills: "", experience: "" };

export default function CareerPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [resume, setResume] = useState(emptyResume);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const payload = await apiRequest("/career", { token });
      const normalizedPayload = {
        ...payload,
        jobs: Array.isArray(payload?.jobs) ? payload.jobs : [],
        workshops: Array.isArray(payload?.workshops) ? payload.workshops : [],
        applications: Array.isArray(payload?.applications) ? payload.applications : []
      };
      setData(normalizedPayload);
      if (payload?.latestResume) {
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

  const saveResume = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/career/resume", { method: "PUT", token, body: resume });
      setMessage("Resume profile updated successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const apply = async (jobId) => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/career/apply", { method: "POST", token, body: { jobId } });
      setMessage("Application submitted. AEGIS will keep tracking the status.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const resumeText = `${resume.summary} ${resume.skills} ${resume.experience}`.trim();
  const jobsWithInsights = useMemo(
    () => (data?.jobs || []).map((job) => ({ ...job, ...buildCareerInsights(job, resumeText) })),
    [data?.jobs, resumeText]
  );
  const suggestedJobs = useMemo(
    () => [...jobsWithInsights].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3),
    [jobsWithInsights]
  );
  const applied = new Set((data?.applications || []).map((item) => item.jobId));

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading career module...</div>;

  return (
    <>
      <section className="module-hero">
        <div>
          <div className="section-eyebrow">Career Transition Support</div>
          <h1>💼 Career Development & Re-employment</h1>
          <p className="subtle">AEGIS highlights why a role matches your service profile, where skill gaps exist, and how to close them fast.</p>
        </div>
        <div className="hero-mini-panel">
          <strong>Top Match</strong>
          {suggestedJobs[0] ? (
            <>
              <span className={`badge ${suggestedJobs[0].matchPercent >= 80 ? "success" : "warning"}`}>{suggestedJobs[0].matchPercent}% Match</span>
              <p className="subtle">{suggestedJobs[0].title}</p>
            </>
          ) : (
            <p className="subtle">No active recommendation.</p>
          )}
        </div>
      </section>

      {message && <div className="alert success">{message}</div>}

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">Recommended For You</div>
          <h2>Suggested Jobs</h2>
          <div className="job-reco-stack">
            {suggestedJobs.length ? suggestedJobs.map((job) => (
              <article key={job.id} className="job-reco-card">
                <div className="claim-summary-head">
                  <strong>{job.title}</strong>
                  <span className={`badge ${job.matchPercent >= 80 ? "success" : "warning"}`}>{job.matchPercent}% Match</span>
                </div>
                <p>{job.company} · {job.location}</p>
                <p className="subtle"><strong>Why this job matches you:</strong> {job.reason}</p>
                <p><strong>Skill gaps:</strong> {job.skillGaps.length ? job.skillGaps.join(", ") : "No major gaps detected"}</p>
                <p><strong>Upskilling:</strong> {job.upskilling.length ? job.upskilling.join(" ") : "You appear ready for this opportunity."}</p>
              </article>
            )) : <p>No job recommendations available.</p>}
          </div>
        </article>

        <article className="card">
          <div className="section-eyebrow">Resume Builder</div>
          <h2>Resume Profile</h2>
          <form className="form-grid" onSubmit={saveResume}>
            <label>
              Professional Summary
              <textarea rows={4} value={resume.summary} onChange={(event) => setResume((prev) => ({ ...prev, summary: event.target.value }))} required />
            </label>
            <label>
              Key Skills
              <textarea rows={3} value={resume.skills} onChange={(event) => setResume((prev) => ({ ...prev, skills: event.target.value }))} required />
            </label>
            <label>
              Experience Highlights
              <textarea rows={4} value={resume.experience} onChange={(event) => setResume((prev) => ({ ...prev, experience: event.target.value }))} required />
            </label>
            <button type="submit">Save Resume Profile</button>
          </form>
        </article>
      </section>

      <section className="card">
        <div className="section-eyebrow">Job Board</div>
        <h2>Current Opportunities</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Company</th>
                <th>Match</th>
                <th>Why It Fits</th>
                <th>Skill Gaps</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobsWithInsights.length ? jobsWithInsights.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <div className="subtle">{job.location} · {job.employmentType}</div>
                  </td>
                  <td>{job.company}</td>
                  <td><span className={`badge ${job.matchPercent >= 80 ? "success" : "warning"}`}>{job.matchPercent}%</span></td>
                  <td>{job.reason}</td>
                  <td>{job.skillGaps.length ? job.skillGaps.join(", ") : "No major gaps"}</td>
                  <td>
                    {applied.has(job.id) ? (
                      <span className="badge success">Applied</span>
                    ) : (
                      <button type="button" onClick={() => apply(job.id)}>Apply Now</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No active roles available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <div className="section-eyebrow">Upskilling Recommendations</div>
          <h2>Close the Gap Faster</h2>
          <ul className="list compact">
            {suggestedJobs.flatMap((job) => job.upskilling).slice(0, 4).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
            {!suggestedJobs.flatMap((job) => job.upskilling).length && <li>Your profile is already strong for current matches.</li>}
          </ul>
        </article>

        <article className="card">
          <div className="section-eyebrow">Application Tracker & Workshops</div>
          <h2>Keep Momentum</h2>
          <ul className="list compact">
            {data.applications.length ? data.applications.map((application) => (
              <li key={application.id}>
                <strong>{application.job?.title || "Job"}</strong> at {application.job?.company || "Company"}
                <div>
                  <span className={`badge ${getStatusBadgeClass(application.status)}`}>{application.status}</span> · Applied {new Date(application.appliedAt).toLocaleDateString()}
                </div>
              </li>
            )) : <li>No job applications submitted yet.</li>}
          </ul>
          <h3>Workshops</h3>
          <ul className="list compact">
            {data.workshops.length ? data.workshops.map((workshop) => (
              <li key={workshop.id}>
                <strong>{workshop.title}</strong>
                <div className="subtle">{new Date(workshop.startTime).toLocaleString()} · {workshop.mode}</div>
              </li>
            )) : <li>No upcoming workshops.</li>}
          </ul>
        </article>
      </section>
    </>
  );
}
