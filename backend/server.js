// ===== imports & setup (ADD AT TOP) =====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const StudentVue = require('studentvue.js');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));

// tiny in-memory session store (replace with Redis/DB in prod)
const sessions = new Map();
const sid = () => Math.random().toString(36).slice(2);

const DEFAULT_DISTRICT_URL = process.env.STUDENTVUE_DISTRICT_URL;
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
// ===== ROUTES (ADD BELOW SETUP) =====

// Login with StudentVUE (stores a server-side session)
app.post('/api/studentvue/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, districtUrl } = req.body || {};
    const pvueUrl = districtUrl || DEFAULT_DISTRICT_URL;
    if (!pvueUrl) return res.status(400).json({ error: 'Missing districtUrl' });
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    // StudentVUE login -> returns client
    const client = await StudentVue.login(pvueUrl, username, password); // uses StudentVUE lib
    const sessionId = sid();
    sessions.set(sessionId, { client, createdAt: Date.now() });

    // In production, set httpOnly cookie instead
    res.json({ ok: true, sessionId });
  } catch (err) {
    console.error(err);
    res.status(401).json({ ok: false, error: 'Login failed. Check district URL/username/password.' });
  }
});

// middleware to require a valid session
function withClient(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body.sessionId;
  const entry = sessionId && sessions.get(sessionId);
  if (!entry) return res.status(401).json({ error: 'Invalid or expired session' });
  req.sv = entry.client;
  next();
}

// Example: gradebook
app.get('/api/studentvue/gradebook', withClient, async (req, res) => {
  try {
    const data = await req.sv.getGradebook(); // current grades if no reportPeriod passed
    res.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to fetch gradebook' });
  }
});

// Example: attendance
app.get('/api/studentvue/attendance', withClient, async (req, res) => {
  try {
    const data = await req.sv.getAttendance();
    res.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to fetch attendance' });
  }
});

// Optional: district lookup by ZIP to help users find their portal URL
app.get('/api/studentvue/districts', async (req, res) => {
  try {
    const { zip } = req.query;
    if (!zip) return res.status(400).json({ error: 'Missing ?zip=' });
    const list = await StudentVue.getDistrictUrls(zip);
    res.json({ ok: true, list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to fetch districts' });
  }
});
// ===== START SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
