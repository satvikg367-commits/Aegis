import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest("/auth/me", { token })
      .then((data) => {
        setUser(data.user);
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
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const data = await apiRequest("/auth/me", { token });
    setUser(data.user);
  };

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token && user), login, logout, refreshUser }),
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
