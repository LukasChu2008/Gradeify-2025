import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/manual";

export default function Register() {
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
      await register({ username: username.trim(), password });
      nav("/manual");
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h1 className="title">Join Gradeify ✨</h1>
      <p className="subtitle">Make tracking your grades a breeze 🌸</p>

      <form onSubmit={onSubmit} className="login-form">
        <input
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          placeholder="Create a password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="error-text">{err}</p>}
        <button disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="switch-link">
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </p>
    </div>
  );
}
