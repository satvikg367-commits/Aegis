import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import profileRoutes from "./routes/profile.js";
import pensionRoutes from "./routes/pension.js";
import healthcareRoutes from "./routes/healthcare.js";
import careerRoutes from "./routes/career.js";
import communityRoutes from "./routes/community.js";
import resourcesRoutes from "./routes/resources.js";
import notificationsRoutes from "./routes/notifications.js";
import feedbackRoutes from "./routes/feedback.js";
import { getDb } from "./lib/db.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const configuredOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const configuredOriginPatterns = (
  process.env.FRONTEND_ORIGIN_PATTERNS || "https://*.onrender.com,http://*.onrender.com"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const allowPrivateNetworkOrigins = process.env.ALLOW_PRIVATE_NETWORK_ORIGINS !== "false";
const allowAllOrigins = process.env.CORS_ALLOW_ALL === "true" || configuredOrigins.includes("*");
const privateNetworkOriginPattern = /^https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?::\d+)?$/i;

const allowedOrigins = new Set(configuredOrigins);
for (const origin of configuredOrigins) {
  if (origin.includes("localhost")) {
    allowedOrigins.add(origin.replace("localhost", "127.0.0.1"));
  }
  if (origin.includes("127.0.0.1")) {
    allowedOrigins.add(origin.replace("127.0.0.1", "localhost"));
  }
}

const wildcardPatternToRegex = (pattern) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i");
const allowedOriginRegexes = configuredOriginPatterns.map(wildcardPatternToRegex);

const isOriginAllowed = (origin) => {
  if (!origin || allowAllOrigins) return true;
  if (allowedOrigins.has(origin)) return true;
  if (allowPrivateNetworkOrigins && privateNetworkOriginPattern.test(origin)) return true;
  return allowedOriginRegexes.some((regex) => regex.test(origin));
};

const corsOptions = {
  origin(origin, callback) {
    callback(null, isOriginAllowed(origin));
  },
  credentials: false,
  optionsSuccessStatus: 204
};

app.use(
  cors(corsOptions)
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    app: "Retired Defence Officers Portal API",
    message: "API is running.",
    health: "/health",
    meta: "/api/meta"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/meta", (_req, res) => {
  const db = getDb();
  res.status(200).json({
    app: "Retired Defence Officers Portal API",
    version: "1.0.0",
    users: db.users.length
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/pension", pensionRoutes);
app.use("/api/healthcare", healthcareRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
