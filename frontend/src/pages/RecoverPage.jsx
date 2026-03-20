import { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";

const ThreeScene = lazy(() => import("../components/ThreeScene"));

export default function RecoverPage() {
  const enableThreeEffects =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168."));
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onForgot = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await apiRequest("/auth/password/forgot", {
        method: "POST",
        body: { email }
      });
      setGeneratedToken(data.resetToken || "");
      setMessage(data.message || "Token generated");
    } catch (err) {
      setError(err.message);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await apiRequest("/auth/password/reset", {
        method: "POST",
        body: { token, newPassword }
      });
      setMessage(data.message || "Password reset successful");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-stage auth-stage">
      {enableThreeEffects && (
        <Suspense fallback={null}>
          <ThreeScene mode="ambient" className="auth-three-scene" />
        </Suspense>
      )}
      <div className="auth-card">
        <h1>Password Recovery</h1>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <h2>Generate Reset Token</h2>
        <form className="form-grid" onSubmit={onForgot}>
          <label>
            Registered Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit">Generate Token</button>
        </form>

        {generatedToken && (
          <div className="alert warning">
            Development token: <code>{generatedToken}</code>
          </div>
        )}

        <h2>Set New Password</h2>
        <form className="form-grid" onSubmit={onReset}>
          <label>
            Reset Token
            <input value={token} onChange={(e) => setToken(e.target.value)} required />
          </label>
          <label>
            New Password
            <input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </label>
          <button type="submit">Reset Password</button>
        </form>

        <div className="auth-links"><Link to="/login">Back to login</Link></div>
      </div>
    </div>
  );
}
