import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return "";
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors in restricted browser modes
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors in restricted browser modes
  }
}

function loadStoredUser() {
  try {
    const raw = safeGetItem("portal_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    safeRemoveItem("portal_user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeGetItem("portal_token") || "");
  const [user, setUser] = useState(() => loadStoredUser());
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest("/auth/me", { token })
      .then((data) => {
        setUser(data.user);
        safeSetItem("portal_user", JSON.stringify(data.user));
      })
      .catch((err) => {
        const message = String(err?.message || "").toLowerCase();
        const shouldInvalidateSession =
          message.includes("invalid or expired token") ||
          message.includes("authentication required") ||
          message.includes("invalid account") ||
          message.includes("request failed (401)") ||
          message.includes("request failed (403)");

        // Keep local session on transient network/proxy errors to avoid login loops.
        if (shouldInvalidateSession) {
          setToken("");
          setUser(null);
          safeRemoveItem("portal_token");
          safeRemoveItem("portal_user");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setUser(nextUser);
    safeSetItem("portal_token", nextToken);
    safeSetItem("portal_user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    safeRemoveItem("portal_token");
    safeRemoveItem("portal_user");
  };

  const refreshUser = async () => {
    if (!token) return;
    const data = await apiRequest("/auth/me", { token });
    setUser(data.user);
    safeSetItem("portal_user", JSON.stringify(data.user));
  };

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token), login, logout, refreshUser }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
