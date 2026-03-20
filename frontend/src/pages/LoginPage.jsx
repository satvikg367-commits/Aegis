import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const ThreeScene = lazy(() => import("../components/ThreeScene"));
const INTRO_DURATION_MS = 4300;
const INTRO_SEEN_KEY = "aegis:intro_seen";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("retired.officer@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [code, setCode] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";
  });

  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      setShowIntro(false);
    }, INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipIntro = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    setShowIntro(false);
  };

  const replayIntro = () => {
    window.sessionStorage.removeItem(INTRO_SEEN_KEY);
    setShowIntro(true);
  };

  return (
    <div className="login-stage">
      <Suspense fallback={null}>
        <ThreeScene mode="ambient" className="auth-three-scene" />
      </Suspense>
      {showIntro && (
        <section className="cinematic-intro" aria-label="AEGIS Intro">
          <div className="cinematic-noise" aria-hidden="true" />
          <div className="cinematic-lights" aria-hidden="true">
            <span className="beam beam-a" />
            <span className="beam beam-b" />
            <span className="beam beam-c" />
          </div>
          <div className="cinematic-core" aria-hidden="true">
            <span className="core-ring ring-1" />
            <span className="core-ring ring-2" />
            <span className="core-ring ring-3" />
          </div>
          <div className="cinematic-copy">
            <p className="cinematic-kicker">Retired Defence Officers Digital Command Platform</p>
            <h1 className="cinematic-brand">AEGIS</h1>
            <p className="cinematic-tagline">Mission-ready pension, healthcare, career, and community support.</p>
            <div className="cinematic-progress" aria-hidden="true">
              <span className="cinematic-progress-fill" />
            </div>
          </div>
          <button type="button" className="cinematic-skip" onClick={skipIntro}>
            Skip Intro
          </button>
        </section>
      )}

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
          <button type="button" className="link-button" onClick={replayIntro}>
            Replay intro
          </button>
        </div>
        <p className="subtle">Demo user: retired.officer@example.com / ChangeMe123!</p>
      </div>
    </div>
  );
}
