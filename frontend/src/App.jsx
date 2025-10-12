import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";

const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);
  const location = useLocation();

  // capture runtime errors & unhandled rejections
  useEffect(() => {
    const onError = (e) => setErr(e?.error || e?.reason || e);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);

  // reset error when navigating to a different route
  useEffect(() => {
    if (err) setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            wordBreak: "break-word",
          }}
        >
{String(err?.stack || err?.message || err)}
        </pre>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link to="/" replace className="border px-3 py-2 rounded">
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

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div style={{ padding: 16 }}>
            <p>Loading…</p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
