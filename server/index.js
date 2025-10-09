import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import StudentVue from "studentvue"; // install: npm i studentvue

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const sv = await StudentVue.login(
      username,
      password,
      process.env.DISTRICT_URL // e.g., https://wa-bsd405-psv.edupoint.com/
    );
    const grades = await sv.getGradebook();
    res.json(grades);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
