// src/pages/AuthLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, me } from "../api/manual";

export default function AuthLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");

  // If already logged in (best-effort), skip login page
  useEffect(() => {
    (async () => {
      try {
        const res = await me();
        // optional debugging
        setDebug(`me() on /login => ${JSON.stringify(res)}`);

        if (res?.user) {
          nav("/manual", { replace: true });
        }
      } catch (e) {
        // ignore errors here; just show debug if you want
        setDebug(`me() error: ${e.message}`);
      }
    })();
  }, [nav]);

async function onSubmit(e) {
  e.preventDefault();
  setErr(null);
  setLoading(true);
  setDebug("DEBUG: Submitting login…");
  try {
    const res = await login({ username: username.trim(), password });
    setDebug(prev => `${prev}\nlogin() => ${JSON.stringify(res)}`);

    // ⭐ Save username locally so the dashboard can show it
    if (res?.user?.username) {
      localStorage.setItem("gradeify_username", res.user.username);
    }

    nav("/manual");
  } catch (e) {
    setErr(e.message || "Login failed");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="login-page">
      {/* Debug box at top */}
      {debug && (
        <div
          style={{
            background: "#222",
            color: "white",
            padding: "10px",
            fontSize: "12px",
            marginBottom: "10px",
            whiteSpace: "pre-wrap",
          }}
        >
          {debug}
        </div>
      )}

      <h1 className="title">Gradeify</h1>
      <p className="subtitle">Track your classes, grades, and study smarter!</p>

      <form onSubmit={onSubmit} className="login-form">
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {err && <p className="error-text">{err}</p>}

        <button disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="switch-link">
        No account yet? <Link to="/register" className="link">Create one</Link>
      </p>
    </div>
  );
}
