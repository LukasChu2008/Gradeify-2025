// backend/index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { supabase, newId } from "./db.js";

dotenv.config();

const app = express();

/* ----------- ORIGIN NORMALIZATION + PROXY TRUST ----------- */
const rawOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
const isHttpsOrigin = /^https:\/\//i.test(rawOrigin);

// Needed if you're behind a proxy/https (Codespaces/Cloud), so secure cookies work
if (isHttpsOrigin) app.set("trust proxy", 1);

/* ------------------------ HTTP + Socket.IO ------------------------ */
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: rawOrigin,
    credentials: true,
  },
});

/* -------------------------- middleware -------------------------- */
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: rawOrigin,
    credentials: true,
  })
);
app.use(
  session({
    name: "gradeify.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: isHttpsOrigin
      ? { httpOnly: true, sameSite: "none", secure: true } // HTTPS (Codespaces, etc.)
      : { httpOnly: true, sameSite: "lax", secure: false }, // Local HTTP
  })
);

function requireUser(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not logged in" });
  next();
}

/* ---------------------------- DEBUG ---------------------------- */
// Are we alive?
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// What session does the server see on this request?
app.get("/whoami", (req, res) => {
  res.json({
    userId: req.session?.userId || null,
    sessionId: req.sessionID || null,
  });
});

// Set a test cookie to ensure browser accepts cookies from this origin
app.get("/debug/set-cookie", (req, res) => {
  res.cookie("gradeify_test", "ok", {
    httpOnly: true,
    sameSite: isHttpsOrigin ? "none" : "lax",
    secure: isHttpsOrigin,
  });
  res.json({ ok: true, note: "Set test cookie gradeify_test" });
});

/* -------------------- AUTH (email) /api/* -------------------- */

// Create user (register via email)
app.post("/api/users", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const { data: clash, error: clashErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email);
    if (clashErr) return res.status(500).json({ error: clashErr.message });
    if (clash?.length) return res.status(409).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({ email, password_hash })
      .select("id, email")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Ensure clean session + save
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = data.id;
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: "Session save failed" });
        res.status(201).json({ id: data.id, email: data.email });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login (email)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email)
      .single();

    if (error) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: "Session save failed" });
        res.json({ id: user.id, email: user.email });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------- AUTH (username) /auth/* -------------------- */

// Register (username)
app.post("/auth/register", async (req, res) => {
  try {
    const { username = "", password = "" } = req.body || {};
    const uname = username.trim();
    if (!uname || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    // case-insensitive uniqueness check
    const { data: clash, error: cErr } = await supabase
      .from("users")
      .select("id")
      .ilike("username", uname);
    if (cErr) return res.status(500).json({ error: cErr.message });
    if (clash?.length) return res.status(409).json({ error: "Username already in use." });

    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from("users")
      .insert({ username: uname, password_hash: hash })
      .select("id, username")
      .single();
    if (error) return res.status(400).json({ error: error.message });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = data.id;
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: "Session save failed" });
        res.json({ ok: true, user: data });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Registration failed" });
  }
});

// Login (username)
app.post("/auth/login", async (req, res) => {
  try {
    const { username = "", password = "" } = req.body || {};
    const uname = username.trim();
    if (!uname || !password) return res.status(400).json({ error: "Missing credentials." });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .ilike("username", uname)
      .single();
    if (error) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: "Session save failed" });
        res.json({ ok: true, user: { id: user.id, username: user.username } });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

// Current user (works for either auth style)
app.get("/auth/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ ok: true, user: null });
  const { data, error } = await supabase
    .from("users")
    .select("id, email, username, display_name, preferences, created_at")
    .eq("id", req.session.userId)
    .single();
  if (error) return res.json({ ok: true, user: null });
  res.json({ ok: true, user: data });
});

/* ===================== SETTINGS & PROFILE (/me/*) ===================== */

// Return profile + preferences
app.get("/me/settings", requireUser, async (req, res) => {
  const { data: u, error } = await supabase
    .from("users")
    .select("username, email, display_name, preferences")
    .eq("id", req.session.userId)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  const prefs = u?.preferences || {};
  res.json({
    ok: true,
    profile: { username: u?.username || "", email: u?.email || "", displayName: u?.display_name || "" },
    preferences: { theme: prefs.theme || "light", ...prefs },
  });
});

// Update preferences (merge)
app.patch("/me/preferences", requireUser, async (req, res) => {
  const { data: cur, error: gErr } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", req.session.userId)
    .single();
  if (gErr) return res.status(500).json({ error: gErr.message });
  const merged = { ...(cur?.preferences || {}), ...(req.body || {}) };
  const { error: uErr, data } = await supabase
    .from("users")
    .update({ preferences: merged })
    .eq("id", req.session.userId)
    .select("preferences")
    .single();
  if (uErr) return res.status(500).json({ error: uErr.message });
  res.json({ ok: true, preferences: data.preferences });
});

// Update display name
app.patch("/me/profile", requireUser, async (req, res) => {
  const { displayName = "" } = req.body || {};
  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName.trim() })
    .eq("id", req.session.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, displayName: displayName.trim() });
});

// Change username (case-insensitive uniqueness)
app.patch("/me/username", requireUser, async (req, res) => {
  const { newUsername = "" } = req.body || {};
  const uname = newUsername.trim();
  if (!uname) return res.status(400).json({ error: "Username cannot be empty." });
  const { data: clash, error: cErr } = await supabase
    .from("users")
    .select("id")
    .neq("id", req.session.userId)
    .ilike("username", uname);
  if (cErr) return res.status(500).json({ error: cErr.message });
  if (clash && clash.length) return res.status(409).json({ error: "Username already in use." });
  const { error } = await supabase
    .from("users")
    .update({ username: uname })
    .eq("id", req.session.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, username: uname });
});

// Change password (verify current)
app.patch("/me/password", requireUser, async (req, res) => {
  try {
    const { currentPassword = "", newPassword = "" } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const { data: user, error: gErr } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", req.session.userId)
      .single();
    if (gErr) return res.status(500).json({ error: gErr.message });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(403).json({ error: "Current password incorrect." });

    const hash = await bcrypt.hash(newPassword, 12);
    const { error: uErr } = await supabase
      .from("users")
      .update({ password_hash: hash })
      .eq("id", req.session.userId);
    if (uErr) return res.status(500).json({ error: uErr.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Password change failed" });
  }
});

/* -------------------------- CLASSES (CRUD) -------------------------- */

// List classes
app.get("/me/classes", requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", req.session.userId)
    .order("period", { ascending: true })
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, classes: data });
});

// Create class
app.post("/me/classes", requireUser, async (req, res) => {
  const { name = "", period = null, teacher = null, weight = null } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Class name is required." });
  const payload = {
    user_id: req.session.userId,
    name: name.trim(),
    period,
    teacher,
    weight,
  };
  const { data, error } = await supabase.from("classes").insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true, class: data });
});

// Update class
app.put("/me/classes/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const patch = {};
  if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
  if ("period" in req.body) patch.period = req.body.period;
  if ("teacher" in req.body) patch.teacher = req.body.teacher;
  if ("weight" in req.body) patch.weight = req.body.weight;

  const { data, error } = await supabase
    .from("classes")
    .update(patch)
    .eq("id", id)
    .eq("user_id", req.session.userId)
    .select()
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json({ ok: true, class: data });
});

// Delete class (also delete grades if not using FK cascade)
app.delete("/me/classes/:id", requireUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", id)
    .eq("user_id", req.session.userId);

  if (error) return res.status(404).json({ error: "Class not found." });

  // If you didn't set ON DELETE CASCADE on grades.class_id:
  await supabase.from("grades").delete().eq("class_id", id).eq("user_id", req.session.userId);

  res.json({ ok: true });
});

/* --------------------------- GRADES (CRUD) --------------------------- */

// List grades for a class
app.get("/me/classes/:classId/grades", requireUser, async (req, res) => {
  const { classId } = req.params;
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("class_id", classId)
    .eq("user_id", req.session.userId)
    .order("due_date", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, grades: data });
});

// Create grade
app.post("/me/classes/:classId/grades", requireUser, async (req, res) => {
  const { classId } = req.params;
  const { title = "", points_earned, points_possible, category = null, due_date = null } =
    req.body || {};
  if (!title.trim()) return res.status(400).json({ error: "Title is required." });
  if (points_earned == null || points_possible == null)
    return res.status(400).json({ error: "Points earned/possible are required." });

  const payload = {
    user_id: req.session.userId,
    class_id: classId,
    title: title.trim(),
    points_earned: Number(points_earned),
    points_possible: Number(points_possible),
    category,
    due_date,
  };
  const { data, error } = await supabase.from("grades").insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true, grade: data });
});

// Update grade
app.put("/me/grades/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const patch = {};
  if (typeof req.body?.title === "string") patch.title = req.body.title.trim();
  if ("points_earned" in req.body) patch.points_earned = Number(req.body.points_earned);
  if ("points_possible" in req.body) patch.points_possible = Number(req.body.points_possible);
  if ("category" in req.body) patch.category = req.body.category;
  if ("due_date" in req.body) patch.due_date = req.body.due_date;

  const { data, error } = await supabase
    .from("grades")
    .update(patch)
    .eq("id", id)
    .eq("user_id", req.session.userId)
    .select()
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json({ ok: true, grade: data });
});

// Delete grade
app.delete("/me/grades/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("grades")
    .delete()
    .eq("id", id)
    .eq("user_id", req.session.userId);
  if (error) return res.status(404).json({ error: "Grade not found." });
  res.json({ ok: true });
});

/* ------------------------- CATEGORIES (CRUD) ------------------------- */

// List categories
app.get("/me/classes/:classId/categories", requireUser, async (req, res) => {
  const { classId } = req.params;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("class_id", classId)
    .eq("user_id", req.session.userId)
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, categories: data });
});

// Create category
app.post("/me/classes/:classId/categories", requireUser, async (req, res) => {
  const { classId } = req.params;
  const { name = "", weight_percent } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Category name is required." });
  const w = Number(weight_percent);
  if (!Number.isFinite(w) || w <= 0 || w > 100) {
    return res.status(400).json({ error: "Weight must be 1–100." });
  }
  const { data, error } = await supabase
    .from("categories")
    .insert({
      id: newId(), // optional; DB can generate too
      user_id: req.session.userId,
      class_id: classId,
      name: name.trim(),
      weight_percent: w,
    })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true, category: data });
});

// Update category
app.put("/me/categories/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const patch = {};
  if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
  if ("weight_percent" in req.body) {
    const w = Number(req.body.weight_percent);
    if (!Number.isFinite(w) || w <= 0 || w > 100) {
      return res.status(400).json({ error: "Weight must be 1–100." });
    }
    patch.weight_percent = w;
  }
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .eq("user_id", req.session.userId)
    .select()
    .single();
  if (error) return res.status(404).json({ error: "Category not found." });
  res.json({ ok: true, category: data });
});

// Delete category
app.delete("/me/categories/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", req.session.userId);
  if (error) return res.status(404).json({ error: "Category not found." });
  res.json({ ok: true });
});

/* ----------------------------- SUMMARY ----------------------------- */
app.get("/me/classes/:classId/summary", requireUser, async (req, res) => {
  const { classId } = req.params;

  const [{ data: cats, error: cErr }, { data: grades, error: gErr }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, weight_percent")
      .eq("class_id", classId)
      .eq("user_id", req.session.userId),
    supabase
      .from("grades")
      .select("title, points_earned, points_possible, category")
      .eq("class_id", classId)
      .eq("user_id", req.session.userId),
  ]);
  if (cErr || gErr) return res.status(500).json({ error: (cErr || gErr).message });

  const byCat = new Map();
  for (const g of grades) {
    const key = (g.category || "Uncategorized").trim().toLowerCase();
    const cur = byCat.get(key) || { earned: 0, possible: 0, name: g.category || "Uncategorized" };
    cur.earned += Number(g.points_earned) || 0;
    cur.possible += Number(g.points_possible) || 0;
    byCat.set(key, cur);
  }

  let sumWeights = 0;
  const catRows = cats.map((c) => {
    const w = Number(c.weight_percent) || 0;
    sumWeights += w;
    const key = c.name.trim().toLowerCase();
    const agg = byCat.get(key) || { earned: 0, possible: 0, name: c.name };
    const pct = agg.possible > 0 ? (agg.earned / agg.possible) * 100 : null;
    return { id: c.id, name: c.name, weight_percent: w, earned: agg.earned, possible: agg.possible, percent: pct };
  });

  for (const [key, agg] of byCat) {
    const already = catRows.find((r) => r.name.trim().toLowerCase() === key);
    if (!already) {
      catRows.push({
        id: null,
        name: agg.name,
        weight_percent: 0,
        earned: agg.earned,
        possible: agg.possible,
        percent: agg.possible > 0 ? (agg.earned / agg.possible) * 100 : null,
      });
    }
  }

  let overall = null;
  if (sumWeights > 0) {
    let acc = 0;
    for (const c of catRows) if (c.weight_percent > 0 && c.percent != null) {
      acc += (c.percent * c.weight_percent) / 100;
    }
    const effective = catRows
      .filter((c) => c.weight_percent > 0 && c.percent != null)
      .reduce((s, c) => s + c.weight_percent, 0);
    overall = effective > 0 ? acc * (100 / effective) : null;
    if (overall == null) {
      const totalEarned = grades.reduce((a, g) => a + (+g.points_earned || 0), 0);
      const totalPossible = grades.reduce((a, g) => a + (+g.points_possible || 0), 0);
      overall = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;
    }
  } else {
    const totalEarned = grades.reduce((a, g) => a + (+g.points_earned || 0), 0);
    const totalPossible = grades.reduce((a, g) => a + (+g.points_possible || 0), 0);
    overall = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;
  }

  res.json({ ok: true, overallPercent: overall, categories: catRows, sumWeights });
});

/* -------------------- GROUPS + REAL-TIME (Socket.IO) -------------------- */

// helper: check membership
async function isMember(userId, groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function requireGroupMember(req, res, next) {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ error: "Missing groupId." });
    const ok = await isMember(req.session.userId, groupId);
    if (!ok) return res.status(403).json({ error: "Not in group" });
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Create a group
app.post("/groups", requireUser, async (req, res) => {
  const { name = "" } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Group name required" });
  const groupId = newId();

  const { error: gErr } = await supabase.from("groups").insert({ id: groupId, name: name.trim() });
  if (gErr) return res.status(500).json({ error: gErr.message });

  // add creator as member
  await supabase.from("group_members").insert({
    id: newId(),
    group_id: groupId,
    user_id: req.session.userId,
  });

  res.json({ ok: true, group: { id: groupId, name: name.trim() } });
});

// Join a group
app.post("/groups/:groupId/join", requireUser, async (req, res) => {
  const { groupId } = req.params;
  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();
  if (!group) return res.status(404).json({ error: "Group not found" });

  // upsert (requires unique index on (group_id, user_id) to be fully idempotent)
  await supabase
    .from("group_members")
    .upsert({ id: newId(), group_id: groupId, user_id: req.session.userId }, { onConflict: "group_id,user_id" });

  res.json({ ok: true, group });
});

// Get classes in a group
app.get("/groups/:groupId/classes", requireUser, requireGroupMember, async (req, res) => {
  const { groupId } = req.params;
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("group_id", groupId)
    .order("period", { ascending: true })
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, classes: data });
});

// Create a class (auto sync)
app.post("/groups/:groupId/classes", requireUser, requireGroupMember, async (req, res) => {
  const { groupId } = req.params;
  const { name = "", period = null, teacher = null, weight = null } = req.body || {};
  if (!name.trim()) return res.status(400).json({ error: "Class name required" });

  const payload = { id: newId(), group_id: groupId, name: name.trim(), period, teacher, weight };
  const { data, error } = await supabase.from("classes").insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });

  io.to(groupId).emit("refreshClasses", { action: "add", class: data });
  res.json({ ok: true, class: data });
});

// Update class (auto sync)
app.put("/groups/:groupId/classes/:id", requireUser, requireGroupMember, async (req, res) => {
  const { groupId, id } = req.params;
  const patch = {};
  if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
  if ("period" in req.body) patch.period = req.body.period;
  if ("teacher" in req.body) patch.teacher = req.body.teacher;
  if ("weight" in req.body) patch.weight = req.body.weight;

  const { data, error } = await supabase
    .from("classes")
    .update(patch)
    .eq("id", id)
    .eq("group_id", groupId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  io.to(groupId).emit("refreshClasses", { action: "update", class: data });
  res.json({ ok: true, class: data });
});

// Delete class (auto sync)
app.delete("/groups/:groupId/classes/:id", requireUser, requireGroupMember, async (req, res) => {
  const { groupId, id } = req.params;
  const { error } = await supabase.from("classes").delete().eq("id", id).eq("group_id", groupId);
  if (error) return res.status(500).json({ error: error.message });

  io.to(groupId).emit("refreshClasses", { action: "delete", classId: id });
  res.json({ ok: true });
});

// --- start server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Backend running on ${PORT} (Socket.IO active)`));
