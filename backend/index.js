import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import StudentVue from "studentvue";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));

// ✅ LOGIN route
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, districtUrl } = req.body;
    const sv = await StudentVue.login(
      username,
      password,
      districtUrl || process.env.DISTRICT_URL
    );
    const gradebook = await sv.getGradebook();
    res.json({ sessionId: sv.token, gradebook });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ GRADEBOOK route
app.get("/api/gradebook", async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"];
    if (!sessionId) throw new Error("Missing session ID");
    const sv = new StudentVue({ token: sessionId });
    const gradebook = await sv.getGradebook();
    res.json(gradebook);
  } catch (err) {
    console.error("Gradebook error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ ATTENDANCE route
app.get("/api/attendance", async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"];
    if (!sessionId) throw new Error("Missing session ID");
    const sv = new StudentVue({ token: sessionId });
    const attendance = await sv.getAttendance();
    res.json(attendance);
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3001, () =>
  console.log(`✅ Backend running on port ${process.env.PORT || 3001}`)
);
