import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/register", { method: "POST", body: form });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create Account</h1>
      <p>Register as retired defence officer to access all services.</p>
      {error && <div className="alert error">{error}</div>}
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Full Name
          <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </label>
        <label>
          Mobile Number
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={8} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      </form>
      <div className="auth-links"><Link to="/login">Back to login</Link></div>
    </div>
  );
}
