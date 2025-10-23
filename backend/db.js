// backend/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open DB
const db = new Database(path.join(__dirname, "gradeify.db"));

// Pragmas
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

/*
 Schema notes
 - We use UUID strings for primary keys (matches newId()).
 - users includes optional display_name and preferences (JSON string).
 - categories has a case-insensitive unique constraint per (user_id, class_id, name).
*/

// ----- USERS -----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,             -- UUID (string)
  username      TEXT UNIQUE NOT NULL,         -- case-insensitive uniqueness enforced in app logic
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  preferences   TEXT,                          -- JSON string of UI/accessibility prefs
  created_at    TEXT NOT NULL
);
`);

// ----- CLASSES -----
db.exec(`
CREATE TABLE IF NOT EXISTS classes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  period     INTEGER,
  teacher    TEXT,
  weight     REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// ----- GRADES -----
db.exec(`
CREATE TABLE IF NOT EXISTS grades (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  class_id        TEXT NOT NULL,
  title           TEXT NOT NULL,
  points_earned   REAL NOT NULL,
  points_possible REAL NOT NULL,
  category        TEXT,
  due_date        TEXT,
  created_at      TEXT NOT NULL,
  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
`);

// ----- CATEGORIES -----
db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  class_id       TEXT NOT NULL,
  name           TEXT NOT NULL,
  weight_percent REAL NOT NULL,  -- 1–100
  created_at     TEXT NOT NULL,
  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
`);

// Case-insensitive uniqueness for category names per (user_id, class_id)
db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique
ON categories(user_id, class_id, name COLLATE NOCASE);
`);

// ID helper
export function newId() {
  return crypto.randomUUID();
}

export default db;
