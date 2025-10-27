// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthLogin from "./pages/AuthLogin.jsx";
import Register from "./pages/Register.jsx";
import ManualDashboard from "./pages/ManualDashboard.jsx";
import SettingsPage from "./pages/Settings.jsx";
import "./App.css";

/* ---------------- ErrorBoundary ---------------- */
function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const onError = (e) => setErr(e?.error || e?.reason || e);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);

  useEffect(() => {
    if (err) setErr(null);
  }, [location.pathname]);

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ color: "#b00020" }}>Something broke at runtime</h1>
        <pre
          style={{
            background: "#f7f7f7",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {String(err?.stack || err?.message || err)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="border px-3 py-2 rounded"
          type="button"
        >
          Reload app
        </button>
      </div>
    );
  }

  return children;
}

/* ---------------- App ---------------- */
export default function App() {
  const location = useLocation();

  // Force light mode on /login and /register; otherwise use saved theme.
  useEffect(() => {
    const forceLight = ["/login", "/register"].includes(location.pathname);
    const saved =
      localStorage.getItem("gradeify_theme") === "dark" ? "dark" : "light";
    document.documentElement.setAttribute(
      "data-theme",
      forceLight ? "light" : saved
    );
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manual" element={<ManualDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
