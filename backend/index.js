import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import session from "express-session";
import StudentVue from "studentvue";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true
}));

app.use(session({
  name: "gradeify.sid",
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax", // in prod behind HTTPS and cross-site: sameSite:"none", secure:true
    secure: false
  }
}));

function requireClient(req, res, next) {
  if (!req.session.sv) return res.status(401).json({ error: "Not logged in" });
  next();
}

app.post("/api/login", async (req, res) => {
  try {
    const { districtUrl, username, password } = req.body || {};
    const url = districtUrl || process.env.DISTRICT_URL;
    if (!url) return res.status(400).json({ error: "Missing districtUrl" });
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

    // modern studentvue signature
    // (districtUrl, { username, password })
    await StudentVue.login(url, { username, password });

    // store minimal creds in session; rehydrate per request
    req.session.sv = { url, username, password };
    req.session.save(err => {
      if (err) return res.status(500).json({ error: "Session error" });
      res.json({ ok: true });
    });
  } catch (e) {
    res.status(401).json({ error: e.message || "Login failed" });
  }
});

async function getClient(req) {
  const s = req.session.sv;
  if (!s) throw new Error("No session");
  return StudentVue.login(s.url, { username: s.username, password: s.password });
}

app.get("/api/gradebook", requireClient, async (req, res) => {
  try {
    const client = await getClient(req);
    const data = await client.getGradebook();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch gradebook" });
  }
});

app.get("/api/attendance", requireClient, async (req, res) => {
  try {
    const client = await getClient(req);
    const data = await client.getAttendance();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch attendance" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.listen(process.env.PORT || 3001, () =>
  console.log(`✅ Backend on ${process.env.PORT || 3001}`)
);
