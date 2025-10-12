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
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Sign in (Gradeify)</h1>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="border p-2 w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="border px-4 py-2 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm">
        No account? <Link to="/register" className="underline">Create one</Link>
      </p>
    </div>
  );
}
