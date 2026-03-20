import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getStatusBadgeClass } from "../utils/status";

const emptyResume = { summary: "", skills: "", experience: "" };

function scoreJobMatch(job, resumeText) {
  const source = `${job.title} ${job.description} ${job.company}`.toLowerCase();
  const profile = resumeText.toLowerCase();
  let score = 52;

  const signals = [
    ["security", 12],
    ["operations", 9],
    ["leadership", 10],
    ["compliance", 9],
    ["training", 8],
    ["mentor", 7],
    ["admin", 6]
  ];

  for (const [term, points] of signals) {
    if (source.includes(term) && profile.includes(term)) score += points;
  }

  if (job.location?.toLowerCase().includes("remote")) score += 3;

  return Math.max(55, Math.min(96, Math.round(score)));
}

function buildRecommendationReason(job) {
  const source = `${job.title} ${job.description}`.toLowerCase();
  if (source.includes("security")) return "Strong fit for defence operations and security leadership experience.";
  if (source.includes("training") || source.includes("mentor")) return "Leadership and mentoring background aligns with this role.";
  if (source.includes("compliance")) return "Operational governance and disciplined process experience are relevant.";
  return "Role aligns with service discipline, planning, and team coordination strengths.";
}

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

  const resumeText = `${resume.summary} ${resume.skills} ${resume.experience}`.trim();
  const suggestedJobs = useMemo(() => {
    if (!data?.jobs) return [];
    return data.jobs
      .map((job) => ({
        ...job,
        match: scoreJobMatch(job, resumeText),
        reason: buildRecommendationReason(job)
      }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
  }, [data?.jobs, resumeText]);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading career module...</div>;

  const applied = new Set(data.applications.map((a) => a.jobId));

  return (
    <>
      <section>
        <h1>Career Development & Re-employment</h1>
        <p className="subtle">Build your resume, explore civilian opportunities, and join workshops for a smooth transition.</p>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Suggested Jobs for You</h2>
          <p className="subtle">Based on your profile and service-aligned strengths.</p>
          <ul className="list compact">
            {suggestedJobs.length ? suggestedJobs.map((job) => (
              <li key={job.id}>
                <strong>{job.title}</strong> - {job.company}
                <div>
                  <span className={`badge ${job.match >= 80 ? "success" : "warning"}`}>Match: {job.match}%</span>
                </div>
                <div className="subtle">{job.reason}</div>
              </li>
            )) : <li>No job recommendations available.</li>}
          </ul>
        </article>

        <article className="card">
          <h2>Resume Preview</h2>
          {resumeText ? (
            <>
              <p><strong>Summary:</strong> {resume.summary || "-"}</p>
              <p><strong>Skills:</strong> {resume.skills || "-"}</p>
              <p><strong>Experience:</strong> {resume.experience || "-"}</p>
            </>
          ) : (
            <p>Add details in Resume Builder to generate your profile preview.</p>
          )}
        </article>
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
            <button type="submit">Save Resume Profile</button>
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
                    <a href={w.link} target="_blank" rel="noreferrer">Join Workshop</a>
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
                <th>Match</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.length ? data.jobs.map((job) => {
                const match = scoreJobMatch(job, resumeText);
                return (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.title}</strong>
                      <div className="subtle">{job.description}</div>
                    </td>
                    <td>{job.company}</td>
                    <td>{job.location}</td>
                    <td>{job.employmentType}</td>
                    <td>{job.salaryRange}</td>
                    <td><span className={`badge ${match >= 80 ? "success" : "warning"}`}>{match}%</span></td>
                    <td>
                      {applied.has(job.id) ? (
                        <span className="badge success">Application Submitted</span>
                      ) : (
                        <button type="button" onClick={() => apply(job.id)}>Apply for Role</button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7}>No job postings available.</td></tr>
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
              <div>
                Status: <span className={`badge ${getStatusBadgeClass(app.status)}`}>{app.status}</span> | Applied {new Date(app.appliedAt).toLocaleDateString()}
              </div>
            </li>
          )) : <li>No applications submitted yet.</li>}
        </ul>
      </section>
    </>
  );
}
