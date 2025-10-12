import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import dotenv from "dotenv";
import StudentVue from "studentvue";

dotenv.config();
const app = express();

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    name: "gradeify.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // in prod + cross-site, use: sameSite: "none", secure: true
      secure: false,
    },
  })
);

// ────────────────────────────────────────────────────────────
function ensureLogin(req, res, next) {
  if (!req.session?.sv) return res.status(401).json({ error: "Not logged in" });
  next();
}

function normalizeDistrictUrl(url = "") {
  return url
    .trim()
    .replace(/^http(s)?:\/\//i, (m) => m.toLowerCase()) // normalize scheme case
    .replace(/\/PXP2_Login_Student\.aspx.*/i, "")
    .replace(/\/$/, "");
}

function addHttpsIfMissing(url = "") {
  if (!/^https?:\/\//i.test(url)) return "https://" + url;
  return url;
}

// ────────────────────────────────────────────────────────────
// SSO preflight: check portal login page for Google/Microsoft SSO
// (Node 18+ has global fetch; we use a short timeout via AbortController.)
// ────────────────────────────────────────────────────────────
async function portalIndicatesSSO(baseUrl) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const loginUrl =
      addHttpsIfMissing(baseUrl.replace(/\/+$/, "")) + "/PXP2_Login_Student.aspx";
    const resp = await fetch(loginUrl, { method: "GET", signal: controller.signal });
    clearTimeout(t);
    const html = await resp.text();
    return /Login With Google|Sign in with Google|Login With Microsoft|Sign in with Microsoft/i.test(
      html
    );
  } catch {
    // If preflight fails (network), do not block; we’ll still try API login.
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { districtUrl, username, password } = req.body || {};
    let url = normalizeDistrictUrl(districtUrl || process.env.DISTRICT_URL);
    if (!url) return res.status(400).json({ error: "Missing districtUrl" });
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

    // Optional: early SSO guard for better UX
    if (await portalIndicatesSSO(url)) {
      return res.status(400).json({
        error:
          "This district’s portal appears to require single sign-on (Google/Microsoft). " +
          "Password login via API isn’t supported. Please use the portal directly.",
      });
    }

    // Modern studentvue signature: (districtUrl, { username, password })
    console.log("🔐 StudentVUE login:", url);
    await StudentVue.login(url, { username, password });

    req.session.sv = { url, username, password };
    req.session.save((err) =>
      err ? res.status(500).json({ error: "Session error" }) : res.json({ ok: true })
    );
  } catch (e) {
    const raw = String(e?.message || "");
    let friendly = raw;

    // Friendlier mapping for common district errors
    if (/D21\d{2}/i.test(raw) || /critical error has occurred/i.test(raw)) {
      friendly =
        "The district’s StudentVUE server returned a critical error. " +
        "This often happens if the portal requires Google/Microsoft login, the portal URL is wrong, " +
        "or the account needs activation/reset.";
    } else if (/invalid|password|username|unauthorized/i.test(raw)) {
      friendly = "Invalid username or password for this portal.";
    }

    console.error("❌ StudentVUE login failed:", raw);
    res.status(401).json({ error: friendly, raw });
  }
});

// ────────────────────────────────────────────────────────────
// Helpers to rehydrate a live client using session creds
// ────────────────────────────────────────────────────────────
async function getClient(req) {
  const s = req.session.sv;
  if (!s) throw new Error("No session");
  return StudentVue.login(s.url, { username: s.username, password: s.password });
}

// ────────────────────────────────────────────────────────────
// Gradebook
// ────────────────────────────────────────────────────────────
app.get("/api/gradebook", ensureLogin, async (req, res) => {
  try {
    const client = await getClient(req);
    const data = await client.getGradebook();
    res.json({ ok: true, data });
  } catch (e) {
    console.error("❌ Gradebook fetch failed:", e.message);
    res.status(500).json({ error: e.message || "Failed to fetch gradebook" });
  }
});

// ────────────────────────────────────────────────────────────
app.get("/api/attendance", ensureLogin, async (req, res) => {
  try {
    const client = await getClient(req);
    const data = await client.getAttendance();
    res.json({ ok: true, data });
  } catch (e) {
    console.error("❌ Attendance fetch failed:", e.message);
    res.status(500).json({ error: e.message || "Failed to fetch attendance" });
  }
});

// ────────────────────────────────────────────────────────────
// District lookup (if supported by the library in your env)
// ────────────────────────────────────────────────────────────
app.get("/api/districts", async (req, res) => {
  try {
    const zip = String(req.query.zip || "").trim();
    if (!zip) return res.status(400).json({ error: "Missing ?zip=" });
    const list = await StudentVue.getDistrictUrls(zip);
    res.json({ ok: true, list });
  } catch (e) {
    res.status(400).json({ error: e.message || "District lookup failed" });
  }
});

// ────────────────────────────────────────────────────────────
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

// ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
