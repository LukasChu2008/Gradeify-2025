// backend/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "gradeify.db"));
db.pragma("journal_mode = WAL");

// ---- Schema (no email) ----
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
                                                        weight_percent REAL NOT NULL, -- 1–100
                                                          created_at TEXT NOT NULL,
                                                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                                              FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
                                                              );
                                                              `);

                                                              /* Case-insensitive uniqueness for category names per user+class.
                                                                 (Expressions like lower(name) are not allowed inside table constraints,
                                                                     so use an index with COLLATE NOCASE.) */
                                                                     db.exec(`
                                                                     CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique
                                                                     ON categories(user_id, class_id, name COLLATE NOCASE);
                                                                     `);

                                                                     export function newId() {
                                                                       return crypto.randomUUID();
                                                                       }

                                                                       export default db;
                                                                       