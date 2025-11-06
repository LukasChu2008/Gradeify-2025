// backend/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "gradeify.db"));
db.pragma("journal_mode = WAL");

// make sure the base tables exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  period INTEGER,
  teacher TEXT,
  weight REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  points_earned REAL NOT NULL,
  points_possible REAL NOT NULL,
  category TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  weight_percent REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique
ON categories(user_id, class_id, name COLLATE NOCASE);
`);

// --- make sure new columns exist on users ---
try {
  db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT;`);
} catch (e) {
  if (!/duplicate column/i.test(e.message)) console.error(e);
}
try {
  db.exec(`ALTER TABLE users ADD COLUMN preferences TEXT;`);
} catch (e) {
  if (!/duplicate column/i.test(e.message)) console.error(e);
}

export function newId() {
  return crypto.randomUUID();
}

export default db;

db.prepare(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups (id)
  )
`).run();