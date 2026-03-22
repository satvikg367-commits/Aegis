import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSeedDatabase } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isDirectoryWritable(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDbPath() {
  const configuredDir = process.env.DATA_DIR;
  const candidateDirs = [
    configuredDir,
    path.resolve(__dirname, "../../data"),
    "/tmp/defence-portal-data"
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    if (isDirectoryWritable(dir)) {
      return path.join(dir, "db.json");
    }
  }

  // Last resort; if this also fails, callers will surface the write error.
  return path.resolve(__dirname, "../../data/db.json");
}

const DB_PATH = resolveDbPath();
const REQUIRED_COLLECTIONS = [
  "users",
  "pensionProfiles",
  "pensionPayments",
  "pensionRequests",
  "pensionExpenses",
  "healthcareProviders",
  "appointments",
  "healthcareClaims",
  "jobPostings",
  "resumes",
  "jobApplications",
  "workshops",
  "csdProducts",
  "csdOrders",
  "forumPosts",
  "forumReplies",
  "resourceItems",
  "notifications",
  "feedbackTickets",
  "passwordResetTokens"
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDbSchema(rawDb) {
  const seed = createSeedDatabase();
  const db = rawDb && typeof rawDb === "object" ? rawDb : {};

  if (!db.meta || typeof db.meta !== "object") db.meta = {};
  if (!db.meta.nextIds || typeof db.meta.nextIds !== "object") db.meta.nextIds = {};
  if (!db.meta.initializedAt) db.meta.initializedAt = seed.meta.initializedAt;

  for (const key of REQUIRED_COLLECTIONS) {
    db[key] = Array.isArray(db[key]) ? db[key] : asArray(seed[key]);
  }

  if (!db.csdProducts.length && Array.isArray(seed.csdProducts) && seed.csdProducts.length) {
    db.csdProducts = seed.csdProducts;
  }
  if (!db.csdOrders.length && Array.isArray(seed.csdOrders) && seed.csdOrders.length) {
    db.csdOrders = seed.csdOrders;
  }

  for (const [key, seedNextId] of Object.entries(seed.meta.nextIds)) {
    const rows = asArray(db[key]);
    const maxId = rows.reduce((max, row) => {
      const id = Number(row?.id);
      if (!Number.isFinite(id)) return max;
      return Math.max(max, id);
    }, 0);

    const storedNextId = Number(db.meta.nextIds[key]);
    const normalizedStoredNextId = Number.isFinite(storedNextId) && storedNextId > 0 ? storedNextId : 1;
    db.meta.nextIds[key] = Math.max(maxId + 1, Number(seedNextId) || 1, normalizedStoredNextId);
  }

  return db;
}

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    const normalizedSeed = normalizeDbSchema(createSeedDatabase());
    fs.writeFileSync(DB_PATH, JSON.stringify(normalizedSeed, null, 2), "utf-8");
    return;
  }

  try {
    const rawText = fs.readFileSync(DB_PATH, "utf-8");
    const normalized = normalizeDbSchema(JSON.parse(rawText));
    const normalizedText = JSON.stringify(normalized);
    if (rawText !== normalizedText) {
      fs.writeFileSync(DB_PATH, JSON.stringify(normalized, null, 2), "utf-8");
    }
  } catch {
    const normalizedSeed = normalizeDbSchema(createSeedDatabase());
    fs.writeFileSync(DB_PATH, JSON.stringify(normalizedSeed, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDbFile();
  return normalizeDbSchema(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")));
}

function writeDb(nextDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(nextDb, null, 2), "utf-8");
}

export function getDb() {
  return readDb();
}

export function updateDb(mutator) {
  const db = readDb();
  const output = mutator(db) ?? db;
  writeDb(output);
  return output;
}

export function nextId(db, key) {
  const val = db.meta?.nextIds?.[key] ?? 1;
  if (!db.meta) db.meta = { nextIds: {} };
  if (!db.meta.nextIds) db.meta.nextIds = {};
  db.meta.nextIds[key] = val + 1;
  return val;
}

export function addNotification(db, userId, category, title, message) {
  const id = nextId(db, "notifications");
  db.notifications.push({
    id,
    userId,
    category,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}

export { DB_PATH };
