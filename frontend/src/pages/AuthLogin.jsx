import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/manual";

export default function AuthLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      nav("/manual");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h1 className="title">Gradeify ☕</h1>
      <p className="subtitle">Welcome back! Let’s get you studying 🎧</p>

      <form onSubmit={onSubmit} className="login-form">
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="error-text">{err}</p>}
        <button disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="switch-link">
        No account? <Link to="/register" className="link">Create one</Link>
      </p>
    </div>
  );
}
