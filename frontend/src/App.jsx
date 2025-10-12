import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthLogin from "./pages/AuthLogin.jsx";
import Register from "./pages/Register.jsx";
import ManualDashboard from "./pages/ManualDashboard.jsx";

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
  }, [location.pathname]); // reset on route change

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ color: "#b00020" }}>Something broke at runtime</h1>
        <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, overflow: "auto", whiteSpace: "pre-wrap" }}>
          {String(err?.stack || err?.message || err)}
        </pre>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link to="/login" replace className="border px-3 py-2 rounded">Back to login</Link>
          <button onClick={() => window.location.reload()} className="border px-3 py-2 rounded" type="button">Reload app</button>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/manual" element={<ManualDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}
