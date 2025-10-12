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

// ====== CATEGORIES (CRUD) ======
app.get("/me/classes/:classId/categories", requireUser, (req, res) => {
  const { classId } = req.params;
  const rows = db.prepare(
    "SELECT * FROM categories WHERE class_id=? AND user_id=? ORDER BY name"
  ).all(classId, req.session.userId);
  res.json({ ok: true, categories: rows });
});

app.post("/me/classes/:classId/categories", requireUser, (req, res) => {
  const { classId } = req.params;
  const { name = "", weight_percent } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Category name is required." });
  const w = Number(weight_percent);
  if (!Number.isFinite(w) || w <= 0 || w > 100) {
    return res.status(400).json({ error: "Weight must be 1–100." });
  }
  const classExists = db.prepare("SELECT 1 FROM classes WHERE id=? AND user_id=?")
    .get(classId, req.session.userId);
  if (!classExists) return res.status(404).json({ error: "Class not found." });

  const id = newId();
  db.prepare(`
    INSERT INTO categories (id, user_id, class_id, name, weight_percent, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.session.userId, classId, name.trim(), w, new Date().toISOString());
  const row = db.prepare("SELECT * FROM categories WHERE id=?").get(id);
  res.json({ ok: true, category: row });
});

app.put("/me/categories/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const { name, weight_percent } = req.body || {};
  const exists = db.prepare("SELECT * FROM categories WHERE id=? AND user_id=?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Category not found." });

  const w = weight_percent == null ? null : Number(weight_percent);
  if (w != null && (!Number.isFinite(w) || w <= 0 || w > 100)) {
    return res.status(400).json({ error: "Weight must be 1–100." });
  }

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      weight_percent = COALESCE(?, weight_percent)
    WHERE id=? AND user_id=?
  `).run(name?.trim() ?? null, w ?? null, id, req.session.userId);

  const row = db.prepare("SELECT * FROM categories WHERE id=?").get(id);
  res.json({ ok: true, category: row });
});

app.delete("/me/categories/:id", requireUser, (req, res) => {
  const { id } = req.params;
  const exists = db.prepare("SELECT 1 FROM categories WHERE id=? AND user_id=?")
    .get(id, req.session.userId);
  if (!exists) return res.status(404).json({ error: "Category not found." });
  db.prepare("DELETE FROM categories WHERE id=? AND user_id=?").run(id, req.session.userId);
  res.json({ ok: true });
});

// ====== SUMMARY (overall grade) ======
app.get("/me/classes/:classId/summary", requireUser, (req, res) => {
  const { classId } = req.params;

  const cats = db.prepare(
    "SELECT id, name, weight_percent FROM categories WHERE class_id=? AND user_id=?"
  ).all(classId, req.session.userId);

  const grades = db.prepare(
    "SELECT title, points_earned, points_possible, category FROM grades WHERE class_id=? AND user_id=?"
  ).all(classId, req.session.userId);

  // Build per-category totals
  const byCat = new Map();
  for (const g of grades) {
    const key = (g.category || "Uncategorized").trim().toLowerCase();
    const cur = byCat.get(key) || { earned: 0, possible: 0, name: g.category || "Uncategorized" };
    cur.earned += Number(g.points_earned) || 0;
    cur.possible += Number(g.points_possible) || 0;
    byCat.set(key, cur);
  }

  // Map categories to weights
  let sumWeights = 0;
  const catRows = cats.map(c => {
    sumWeights += Number(c.weight_percent) || 0;
    const key = c.name.trim().toLowerCase();
    const agg = byCat.get(key) || { earned: 0, possible: 0, name: c.name };
    const pct = agg.possible > 0 ? (agg.earned / agg.possible) * 100 : null;
    return {
      id: c.id,
      name: c.name,
      weight_percent: Number(c.weight_percent),
      earned: agg.earned,
      possible: agg.possible,
      percent: pct
    };
  });

  // Any grades in categories that aren't defined → show them as zero-weight extras
  for (const [key, agg] of byCat) {
    const already = catRows.find(r => r.name.trim().toLowerCase() === key);
    if (!already) {
      catRows.push({
        id: null, name: agg.name, weight_percent: 0,
        earned: agg.earned, possible: agg.possible,
        percent: agg.possible > 0 ? (agg.earned / agg.possible) * 100 : null
      });
    }
  }

  // Compute overall: weighted average of category percents (ignore any 0-weight)
  let overall = null;
  if (sumWeights > 0) {
    let acc = 0;
    for (const c of catRows) {
      if (c.weight_percent > 0 && c.percent != null) {
        acc += (c.percent * c.weight_percent) / 100;
      }
    }
    // If weights don't sum to 100, scale by (sumWeights / 100) so users can partially set them.
    overall = acc * (100 / sumWeights);
  } else {
    // No weights: fall back to straight points across all grades
    const totalEarned = grades.reduce((a, g) => a + (+g.points_earned || 0), 0);
    const totalPossible = grades.reduce((a, g) => a + (+g.points_possible || 0), 0);
    overall = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;
  }

  res.json({
    ok: true,
    overallPercent: overall,
    categories: catRows,
    sumWeights
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));