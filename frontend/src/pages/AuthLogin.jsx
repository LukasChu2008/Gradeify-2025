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


  // If already logged in (via express-session), skip login page
  useEffect(() => {
    me().then((res) => {
      setDebug(`me() on /login => ${JSON.stringify(res)}`);
      if (res?.user) nav("/manual");
    })
    .catch(err => {
      setDebug(`error: ${err.message}`);
    });
  }, [nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    setDebug("Submitting login…");
  
    try {
      const loginRes = await login({ username: username.trim(), password });
      setDebug(prev => prev + "\nlogin() => " + JSON.stringify(loginRes));
  
      // 🔍 Ask the backend who we are *after* login
      const meRes = await me();
      setDebug(prev => prev + "\nafter login me() => " + JSON.stringify(meRes));
  
      if (!meRes?.user) {
        // Login worked BUT /auth/me doesn't see a user: session/cookie issue
        setErr("Logged in, but /auth/me still says no user (session issue).");
        // ⛔ Don't navigate if backend doesn't think we're logged in
        return;
      }
  
      // ✅ Only go to /manual if /auth/me confirms we're logged in
      nav("/manual");
    } catch (e) {
      setErr(e.message || "Login failed");
      setDebug(prev => prev + "\nlogin error => " + (e.message || String(e)));
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="login-page">
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
      DEBUG: {debug}
    </div>
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
