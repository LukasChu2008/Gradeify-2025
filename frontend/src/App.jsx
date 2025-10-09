import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onError = (e) => setErr(e?.error || e?.reason || e);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ color: "#b00020" }}>Something broke at runtime</h1>
        <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, overflow: "auto" }}>
{String(err?.stack || err?.message || err)}
        </pre>
        <p><Link to="/">Back to login</Link></p>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
