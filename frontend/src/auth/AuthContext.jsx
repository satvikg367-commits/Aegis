import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("portal_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("portal_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest("/auth/me", { token })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("portal_user", JSON.stringify(data.user));
      })
      .catch(() => {
        setToken("");
        setUser(null);
        localStorage.removeItem("portal_token");
        localStorage.removeItem("portal_user");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("portal_token", nextToken);
    localStorage.setItem("portal_user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_user");
  };

  const refreshUser = async () => {
    if (!token) return;
    const data = await apiRequest("/auth/me", { token });
    setUser(data.user);
    localStorage.setItem("portal_user", JSON.stringify(data.user));
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
