// src/App.jsx
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthLogin from "./pages/AuthLogin.jsx";
import Register from "./pages/Register.jsx";
import ManualDashboard from "./pages/ManualDashboard.jsx";
import SettingsPage from "./pages/Settings.jsx";
import "./App.css";

/* ------------------- ErrorBoundary ------------------- */
/* Must be rendered inside a Router; index.jsx already provides <BrowserRouter>. */
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

  // Clear error on route change
  useEffect(() => {
    if (err) setErr(null);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link to="/login" replace className="border px-3 py-2 rounded">
            Back to login
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="border px-3 py-2 rounded"
            type="button"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }

  return children;
}

/* ------------------- App Component ------------------- */
export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Optional header/nav */}
        <header style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/manual">Dashboard</Link>
          <Link to="/settings">Settings</Link>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/manual" element={<ManualDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
