import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  ["/", "Home"],
  ["/pension", "Pension"],
  ["/healthcare", "Healthcare"],
  ["/career", "Career"],
  ["/community", "Community"],
  ["/resources", "Resources"],
  ["/notifications", "Notifications"],
  ["/feedback", "Feedback"],
  ["/profile", "Profile"]
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  const fontScale = user?.accessibility?.fontScale || 100;
  const highContrast = Boolean(user?.accessibility?.highContrast);
  const textToSpeech = Boolean(user?.accessibility?.textToSpeech);
  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  const readPage = () => {
    if (!canSpeak) return;
    const main = document.querySelector("main");
    if (!main) return;
    const utterance = new SpeechSynthesisUtterance(main.innerText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`app-root ${highContrast ? "high-contrast" : ""}`} style={{ fontSize: `${fontScale}%` }}>
      <header className="site-header">
        <div className="brand">Retired Defence Officers Portal</div>
        <nav className="top-nav" aria-label="Main Navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "") }>
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={logout}>Logout</button>
      </header>
      <main className="container">{children}</main>
      <footer className="site-footer">Security notice: Never share OTP, password, or reset token.</footer>
      {textToSpeech && canSpeak && (
        <button type="button" className="tts-btn" onClick={readPage}>
          Read This Page
        </button>
      )}
    </div>
  );
}
