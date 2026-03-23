import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { warmApiConnection } from "../api/client";

const ThreeScene = lazy(() => import("./ThreeScene"));
const SmartAssistant = lazy(() => import("./SmartAssistant"));

const links = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/pension", label: "Pension", icon: "pension" },
  { to: "/healthcare", label: "Healthcare", icon: "healthcare" },
  { to: "/career", label: "Career", icon: "career" },
  { to: "/csd", label: "CSD", icon: "csd" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/profile", label: "Profile", icon: "profile" }
];

const pageMetaMap = {
  dashboard: {
    label: "Command Center",
    tagline: "Unified mission snapshot across pension, healthcare, and career services.",
    icon: "home"
  },
  pension: {
    label: "Pension Operations",
    tagline: "Track credits, service requests, and monthly expense control.",
    icon: "pension"
  },
  healthcare: {
    label: "Healthcare Desk",
    tagline: "Book care faster with provider discovery, telehealth, and claims.",
    icon: "healthcare"
  },
  career: {
    label: "Career Transition",
    tagline: "Civilian opportunities, resume building, and workshops in one flow.",
    icon: "career"
  },
  csd: {
    label: "CSD Services",
    tagline: "Subsidized canteen ordering with quick access to essentials and electronics.",
    icon: "csd"
  },
  notifications: {
    label: "Alert Center",
    tagline: "Timely updates from every module, prioritized for quick action.",
    icon: "notifications"
  },
  profile: {
    label: "Security & Profile",
    tagline: "Account controls, accessibility preferences, and two-factor protection.",
    icon: "profile"
  },
  default: {
    label: "AEGIS Portal",
    tagline: "Veteran-first digital support experience.",
    icon: "home"
  }
};

const searchEntries = [
  {
    title: "Check pension status",
    description: "Review pension amount, next payment date, and pension requests.",
    path: "/pension",
    keywords: ["pension", "payment", "next payment", "status", "bank", "life certificate"]
  },
  {
    title: "File a healthcare claim",
    description: "Upload bills or prescriptions and track claim progress.",
    path: "/healthcare",
    keywords: ["claim", "healthcare", "medical", "hospital", "medicine", "reimbursement", "documents"]
  },
  {
    title: "Book healthcare appointment",
    description: "Find providers and schedule hospital or telehealth support.",
    path: "/healthcare",
    keywords: ["appointment", "doctor", "telehealth", "provider", "clinic", "hospital"]
  },
  {
    title: "Explore job recommendations",
    description: "See top career matches, reasoning, and upskilling advice.",
    path: "/career",
    keywords: ["job", "career", "resume", "match", "upskill", "employment", "workshop"]
  },
  {
    title: "Order from CSD",
    description: "Open the canteen store for groceries, electronics, and essentials.",
    path: "/csd",
    keywords: ["csd", "canteen", "store", "order", "cart", "grocery", "electronics", "essentials"]
  },
  {
    title: "Check important notifications",
    description: "See reminders, pension alerts, appointments, and deadlines.",
    path: "/notifications",
    keywords: ["notifications", "alerts", "reminders", "deadlines", "updates"]
  },
  {
    title: "Profile and security",
    description: "Manage 2FA, accessibility settings, and trusted account controls.",
    path: "/profile",
    keywords: ["profile", "security", "2fa", "accessibility", "contrast", "font", "privacy"]
  }
];

function safeGetLocalItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage-restricted browser modes
  }
}

function resolvePageKey(pathname) {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/pension")) return "pension";
  if (pathname.startsWith("/healthcare")) return "healthcare";
  if (pathname.startsWith("/career")) return "career";
  if (pathname.startsWith("/csd")) return "csd";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/profile")) return "profile";
  return "default";
}

function ModuleIcon({ name, className = "module-icon" }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 11.5L12 4l9 7.5v8a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg>
      );
    case "pension":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 9h18M8 14h5" /></svg>
      );
    case "healthcare":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" /></svg>
      );
    case "career":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 8V6a1 1 0 011-1h4a1 1 0 011 1v2M3 12h18" /></svg>
      );
    case "community":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 13a3 3 0 100-6 3 3 0 000 6zM3 20a5 5 0 0110 0M13 20a5 5 0 018 0" /></svg>
      );
    case "csd":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M4 6h2l2.2 9.2a1 1 0 001 .8h7.9a1 1 0 001-.76L20 8H8M10 20a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
      );
    case "resources":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M5 5h10a3 3 0 013 3v11H8a3 3 0 00-3 3zM8 5v17" /></svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M12 22a2.5 2.5 0 002.4-2h-4.8A2.5 2.5 0 0012 22zM18 16V11a6 6 0 10-12 0v5l-2 2h16z" /></svg>
      );
    case "feedback":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" /></svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M12 3l7 3v5c0 5-2.9 8.8-7 10-4.1-1.2-7-5-7-10V6zM12 8a2.4 2.4 0 100 4.8A2.4 2.4 0 0012 8zm-4 8a4 4 0 018 0" /></svg>
      );
    default:
      return <span className={`${className} fallback-icon`} aria-hidden="true">•</span>;
  }
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const isLocalPortal = useMemo(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
  }, []);
  const enableThreeEffects = isLocalPortal;
  const enableEnhancedMotion = isLocalPortal;

  const fontScale = user?.accessibility?.fontScale || 100;
  const highContrast = Boolean(user?.accessibility?.highContrast);
  const textToSpeech = Boolean(user?.accessibility?.textToSpeech);
  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  const pageThemeClass = useMemo(() => {
    if (pathname === "/") return "theme-dashboard";
    if (pathname.startsWith("/pension")) return "theme-pension";
    if (pathname.startsWith("/healthcare")) return "theme-healthcare";
    if (pathname.startsWith("/career")) return "theme-career";
    if (pathname.startsWith("/csd")) return "theme-csd";
    if (pathname.startsWith("/notifications")) return "theme-notifications";
    if (pathname.startsWith("/profile")) return "theme-profile";
    return "theme-default";
  }, [pathname]);

  const pageKey = useMemo(() => resolvePageKey(pathname), [pathname]);
  const pageMeta = pageMetaMap[pageKey] || pageMetaMap.default;

  const [projectorMode, setProjectorMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return safeGetLocalItem("aegis-projector-mode") === "1";
  });
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const parts = query.split(/\s+/).filter(Boolean);

    return searchEntries
      .map((entry) => {
        const haystack = `${entry.title} ${entry.description} ${entry.keywords.join(" ")}`.toLowerCase();
        const directHit = haystack.includes(query) ? 6 : 0;
        const tokenHits = parts.reduce((sum, part) => sum + (haystack.includes(part) ? 2 : 0), 0);
        const score = directHit + tokenHits;
        return score > 0 ? { ...entry, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeSetLocalItem("aegis-projector-mode", projectorMode ? "1" : "0");
  }, [projectorMode]);

  useEffect(() => {
    if (isLocalPortal) return undefined;

    warmApiConnection();
    const timer = window.setInterval(() => {
      warmApiConnection();
    }, 4 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [isLocalPortal]);

  useEffect(() => {
    setSearchQuery("");
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !rootRef.current || !enableEnhancedMotion) return;

    let raf = 0;
    const updateDepth = () => {
      if (!rootRef.current) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      const depth = Math.min(220, window.scrollY * 0.22);

      rootRef.current.style.setProperty("--scroll-progress", String(progress));
      rootRef.current.style.setProperty("--scroll-depth", `${depth.toFixed(1)}px`);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDepth);
    };

    updateDepth();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enableEnhancedMotion, pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !enableEnhancedMotion) return;
    const prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const nodes = Array.from(document.querySelectorAll(".container > section, .card"));
    nodes.forEach((node, index) => {
      node.classList.add("reveal-target");
      node.style.setProperty("--reveal-delay", `${Math.min(index * 35, 340)}ms`);
    });

    if (typeof window.IntersectionObserver !== "function") return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [enableEnhancedMotion, pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !enableEnhancedMotion) return;
    const prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const cards = Array.from(document.querySelectorAll(".card"));
    const cleanups = cards.map((card) => {
      const onMove = (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 10;
        const rotateX = (0.5 - py) * 8;
        card.style.setProperty("--tilt-rx", `${rotateX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-ry", `${rotateY.toFixed(2)}deg`);
        card.classList.add("tilt-active");
      };
      const onLeave = () => {
        card.style.setProperty("--tilt-rx", "0deg");
        card.style.setProperty("--tilt-ry", "0deg");
        card.classList.remove("tilt-active");
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);

      return () => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [enableEnhancedMotion, pathname]);

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

  const openSearchResult = (result) => {
    navigate(result.path);
    setSearchQuery("");
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    if (searchResults[0]) {
      openSearchResult(searchResults[0]);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`app-root ${pageThemeClass} ${projectorMode ? "projector-mode" : ""} ${highContrast ? "high-contrast" : ""}`}
      style={{ fontSize: `${fontScale}%` }}
    >
      <div className="scroll-progress" aria-hidden="true">
        <span className="scroll-progress-fill" />
      </div>
      {!highContrast && enableThreeEffects && (
        <Suspense fallback={null}>
          <ThreeScene mode="ambient" className="global-three-scene" />
        </Suspense>
      )}
      {enableEnhancedMotion && (
        <div className="immersive-layer" aria-hidden="true">
          <span className="immersive-orb orb-a" />
          <span className="immersive-orb orb-b" />
          <span className="immersive-orb orb-c" />
          <span className="immersive-grid" />
        </div>
      )}
      <header className="site-header">
        <div className="brand-stack">
          <div className="brand-mark">AEGIS</div>
          <div className="brand-sub">Retired Defence Officers Command Portal</div>
        </div>
        <nav className="top-nav" aria-label="Main Navigation">
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "") }>
              <span className="nav-link-inner">
                <ModuleIcon name={icon} className="nav-icon" />
                <span>{label}</span>
              </span>
            </NavLink>
          ))}
        </nav>
        <form className="portal-search" onSubmit={onSearchSubmit} role="search" aria-label="Portal Search">
          <input
            className="portal-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search pension, claim, jobs, CSD..."
            aria-label="Search portal services"
          />
          {searchQuery.trim() && (
            <div className="portal-search-results">
              {searchResults.length ? searchResults.map((result) => (
                <button
                  key={`${result.path}-${result.title}`}
                  type="button"
                  className="portal-search-result"
                  onClick={() => openSearchResult(result)}
                >
                  <strong>{result.title}</strong>
                  <span>{result.description}</span>
                </button>
              )) : (
                <div className="portal-search-empty">No exact result yet. Try words like pension, claim, jobs, or CSD.</div>
              )}
            </div>
          )}
        </form>
        <div className="header-actions">
          <span className="module-pill" title="Current module">
            <ModuleIcon name={pageMeta.icon} className="pill-icon" />
            {pageMeta.label}
          </span>
          <button type="button" className="projector-toggle" onClick={() => setProjectorMode((v) => !v)}>
            {projectorMode ? "Projector ON" : "Projector OFF"}
          </button>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="container">
        <div className="page-intro-banner">
          <span className="page-kicker">Now Viewing</span>
          <strong>
            <ModuleIcon name={pageMeta.icon} className="banner-icon" />
            {pageMeta.label}
          </strong>
          <span>{pageMeta.tagline}</span>
        </div>
        <div className="portal-focus-bar">
          <span className="trust-pill">Verified Retiree Access</span>
          <span className="trust-pill">Privacy Protected</span>
          <span className="trust-pill">Smart Guided Actions</span>
        </div>
        {children}
      </main>
      <footer className="site-footer">Security notice: Never share OTP, password, or reset token.</footer>
      {textToSpeech && canSpeak && (
        <button type="button" className="tts-btn" onClick={readPage}>
          Read This Page
        </button>
      )}
      <Suspense fallback={null}>
        <SmartAssistant />
      </Suspense>
    </div>
  );
}
