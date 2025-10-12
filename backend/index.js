import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import db, { newId } from "./db.js";

dotenv.config();
const app = express();

// middleware
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(session({
  name: "gradeify.sid",
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false }
}));

function requireUser(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not logged in" });
  next();
}

/* =============== AUTH (username + password only) =============== */

// POST /auth/register  { username, password }
app.post("/auth/register", async (req, res) => {
  try {
    const { username = "", password = "" } = req.body || {};
    const uname = username.trim();
    if (!uname || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const exists = db.prepare("SELECT 1 FROM users WHERE lower(username) = ?")
      .get(uname.toLowerCase());
    if (exists) return res.status(409).json({ error: "Username already in use." });

    const hash = await bcrypt.hash(password, 12);
    const id = newId();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, uname, hash, new Date().toISOString());

    req.session.userId = id;
    res.json({ ok: true, user: { id, username: uname } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Registration failed" });
  }
});

// POST /auth/login  { username, password }
app.post("/auth/login", async (req, res) => {
  try {
    const { username = "", password = "" } = req.body || {};
    const uname = username.trim().toLowerCase();
    if (!uname || !password) return res.status(400).json({ error: "Missing credentials." });

    const user = db.prepare("SELECT * FROM users WHERE lower(username) = ?").get(uname);
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    req.session.userId = user.id;
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get("/auth/me", (req, res) => {
  if (!req.session?.userId) return res.json({ ok: true, user: null });
  const user = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?")
    .get(req.session.userId);
  res.json({ ok: true, user: user || null });
});

/* ========================= CLASSES (CRUD) ========================= */
app.get("/me/classes", requireUser, (req, res) => {
  const rows = db.prepare("SELECT * FROM classes WHERE user_id = ? ORDER BY period, name")
    .all(req.session.userId);
  res.json({ ok: true, classes: rows });
});

app.post("/me/classes", requireUser, (req, res) => {
  const { name = "", period = null, teacher = null, weight = null } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Class name is required." });
  const id = newId();
  db.prepare(`
    INSERT INTO classes (id, user_id, name, period, teacher, weight, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.session.userId, name.trim(), period, teacher, weight, new Date().toISOString());
  const row = db.prepare("SELECT * FROM classes WHERE id = ?").get(id);
  res.json({ ok: true, class: row });
});

app.put("/me/classes/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const { name, period, teacher, weight } = req.body || {};
  const exists = db.prepare("SELECT 1 FROM classes WHERE id = ? AND user_id = ?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Class not found." });

  db.prepare(`
    UPDATE classes SET
      name = COALESCE(?, name),
      period = COALESCE(?, period),
      teacher = COALESCE(?, teacher),
      weight = COALESCE(?, weight)
    WHERE id = ? AND user_id = ?
  `).run(name?.trim() ?? null, period ?? null, teacher ?? null, weight ?? null, id, req.session.userId);

  const row = db.prepare("SELECT * FROM classes WHERE id = ?").get(id);
  res.json({ ok: true, class: row });
});

app.delete("/me/classes/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const exists = db.prepare("SELECT 1 FROM classes WHERE id = ? AND user_id = ?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Class not found." });
  db.prepare("DELETE FROM classes WHERE id = ? AND user_id = ?").run(id, req.session.userId);
  db.prepare("DELETE FROM grades WHERE class_id = ? AND user_id = ?").run(id, req.session.userId);
  res.json({ ok: true });
});

/* ========================== GRADES (CRUD) ========================= */
app.get("/me/classes/:classId/grades", requireUser, (req, res) => {
  const { classId } = req.params;
  const rows = db.prepare("SELECT * FROM grades WHERE class_id = ? AND user_id = ? ORDER BY due_date")
    .all(classId, req.session.userId);
  res.json({ ok: true, grades: rows });
});

app.post("/me/classes/:classId/grades", requireUser, (req, res) => {
  const { classId } = req.params;
  const { title = "", points_earned, points_possible, category = null, due_date = null } = req.body || {};
  if (!title.trim()) return res.status(400).json({ error: "Title is required." });
  if (points_earned == null || points_possible == null) {
    return res.status(400).json({ error: "Points earned/possible are required." });
  }
  const classExists = db.prepare("SELECT 1 FROM classes WHERE id = ? AND user_id = ?")
    .get(classId, req.session.userId);
  if (!classExists) return res.status(404).json({ error: "Class not found." });

  const id = newId();
  db.prepare(`
    INSERT INTO grades (id, user_id, class_id, title, points_earned, points_possible, category, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.session.userId, classId, title.trim(), +points_earned, +points_possible, category, due_date, new Date().toISOString());
  const row = db.prepare("SELECT * FROM grades WHERE id = ?").get(id);
  res.json({ ok: true, grade: row });
});

app.put("/me/grades/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const { title, points_earned, points_possible, category, due_date } = req.body || {};
  const exists = db.prepare("SELECT 1 FROM grades WHERE id = ? AND user_id = ?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Grade not found." });

  db.prepare(`
    UPDATE grades SET
      title = COALESCE(?, title),
      points_earned = COALESCE(?, points_earned),
      points_possible = COALESCE(?, points_possible),
      category = COALESCE(?, category),
      due_date = COALESCE(?, due_date)
    WHERE id = ? AND user_id = ?
  `).run(title?.trim() ?? null, points_earned ?? null, points_possible ?? null, category ?? null, due_date ?? null, id, req.session.userId);

  const row = db.prepare("SELECT * FROM grades WHERE id = ?").get(id);
  res.json({ ok: true, grade: row });
});

app.delete("/me/grades/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const exists = db.prepare("SELECT 1 FROM grades WHERE id = ? AND user_id = ?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Grade not found." });
  db.prepare("DELETE FROM grades WHERE id = ? AND user_id = ?").run(id, req.session.userId);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));