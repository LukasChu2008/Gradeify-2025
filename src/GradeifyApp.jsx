// src/App.jsx
import { useState } from "react";
import "./App.css";

function App() {
  const [currentGrade, setCurrentGrade] = useState("");
  const [expectedScore, setExpectedScore] = useState("");
  const [weight, setWeight] = useState("");
  const [newGrade, setNewGrade] = useState(null);

  const calculate = () => {
    if (!currentGrade || !expectedScore || !weight) return;
    const weighted =
      (currentGrade * (100 - weight) + expectedScore * weight) / 100;
    setNewGrade(weighted.toFixed(2));
  };

  return (
    <div className="App">
      <h1>📊 Gradeify</h1>
      <p>Test how your grade changes with upcoming assignments</p>

      <input
        type="number"
        placeholder="Current Grade (%)"
        value={currentGrade}
        onChange={(e) => setCurrentGrade(e.target.value)}
      />
      <input
        type="number"
        placeholder="Expected Score (%)"
        value={expectedScore}
        onChange={(e) => setExpectedScore(e.target.value)}
      />
      <input
        type="number"
        placeholder="Assignment Weight (%)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />

      <button onClick={calculate}>Calculate</button>

      {newGrade && (
        <h2>
          ✅ Your new overall grade would be: <span>{newGrade}%</span>
        </h2>
      )}
    </div>
  );
}

export default App;
