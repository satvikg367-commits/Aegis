import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("retired.officer@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [code, setCode] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password, code: requires2fa ? code : undefined }
      });

      if (data.requires2fa) {
        setRequires2fa(true);
        return;
      }

      login({ token: data.token, user: data.user });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">AEGIS</div>
      <h1>Secure Login</h1>
      <p>Access pension, healthcare, career, and community modules.</p>
      {error && <div className="alert error">{error}</div>}
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {requires2fa && (
          <label>
            2FA Code
            <input value={code} onChange={(e) => setCode(e.target.value)} type="text" maxLength={6} required />
          </label>
        )}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
      </form>
      <div className="auth-links">
        <Link to="/register">Create account</Link>
        <Link to="/recover">Forgot password</Link>
      </div>
      <p className="subtle">Demo user: retired.officer@example.com / ChangeMe123!</p>
    </div>
  );
}
