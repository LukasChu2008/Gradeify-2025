import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ui.css"; // reuse your base theme

export default function SettingsPage() {
  const nav = useNavigate();

  const [theme, setTheme] = useState("light");
  const [textScale, setTextScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  // load saved preferences
  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem("userPrefs") || "{}");
    if (prefs.theme) setTheme(prefs.theme);
    if (prefs.textScale) setTextScale(prefs.textScale);
    if (prefs.highContrast) setHighContrast(prefs.highContrast);
  }, []);

  // save when values change
  useEffect(() => {
    localStorage.setItem(
      "userPrefs",
      JSON.stringify({ theme, textScale, highContrast })
    );
  }, [theme, textScale, highContrast]);

  function handleBack() {
    nav("/manual");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background:
          theme === "dark"
            ? "linear-gradient(180deg, #1c1f2b, #2e3350)"
            : "linear-gradient(180deg, #f5f7ff, #e1e6ff)",
        color: theme === "dark" ? "#eee" : "#222",
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme === "dark" ? "#2b2f45" : "white",
          borderRadius: 20,
          padding: "2rem 2.5rem",
          boxShadow:
            theme === "dark"
              ? "0 4px 16px rgba(0,0,0,0.5)"
              : "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.8rem", margin: 0, color: "#5a4afc" }}>
            Settings
          </h1>
          <button
            onClick={handleBack}
            className="btn"
            style={{
              background: "#5a4afc",
              color: "white",
              borderRadius: "8px",
              border: "none",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Appearance Section */}
        <section style={{ marginBottom: "1.8rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>
            Appearance
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Theme:</label>
            <select
              className="input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                padding: "0.4rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "white",
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </section>

        {/* Text Size */}
        <section style={{ marginBottom: "1.8rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>
            Text Size
          </h2>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={textScale}
            onChange={(e) => setTextScale(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: `${textScale}rem`, marginTop: "0.6rem" }}>
            Preview text size
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>
            Accessibility
          </h2>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={() => setHighContrast(!highContrast)}
            />
            Enable high contrast mode
          </label>
        </section>

        {/* Save Button */}
        <div style={{ marginTop: "2rem", textAlign: "right" }}>
          <button
            onClick={() => alert("Preferences saved!")}
            className="btn"
            style={{
              background: "#5a4afc",
              color: "white",
              borderRadius: "8px",
              border: "none",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
