import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // <- make sure this is your initialized client

export default function AuthLogin() {
  const nav = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, skip login page
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/manual");
    });
  }, [nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // If you use email on Supabase, pass an email. If you're storing "username",
      // map it to an email or query first. For now, assume it's an email:
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameOrEmail.trim(),
        password
      });
      if (error) throw error;
      // session cookies are set by supabase-js; now safe to navigate
      nav("/manual");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h1 className="title">Gradeify</h1>
      <p className="subtitle">Track your classes, grades, and study smarter!</p>

      <form onSubmit={onSubmit} className="login-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="text"
            placeholder="Enter your email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
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
