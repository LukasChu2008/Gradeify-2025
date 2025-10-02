const express = require("express");
const cors = require("cors");
const StudentVue = require("studentvue");

const app = express();
app.use(cors());
app.use(express.json());

// Login + get grades
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const client = await StudentVue.login(
      username,
      password,
      "https://YOUR_DISTRICT_DOMAIN" // Replace with actual StudentVUE URL
    );

    const grades = await client.getGradebook();
    res.json(grades);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));

