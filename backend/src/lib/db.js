import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSeedDatabase } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../../data/db.json");

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
    return;
  }

  try {
    JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
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
