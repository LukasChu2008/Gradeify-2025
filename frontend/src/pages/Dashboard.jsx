import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGradebook, fetchAttendance } from "../api/studentvue";

export default function Dashboard() {
  const navigate = useNavigate();

  const [gradebook, setGradebook] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      // fetch in parallel
      const [g, a] = await Promise.all([fetchGradebook(), fetchAttendance()]);

      // backend shape is { ok: true, data: ... }
      setGradebook(g?.data ?? g ?? null);
      setAttendance(a?.data ?? a ?? null);
    } catch (e) {
      const msg = e?.message || "Failed to load data";
      setErr(msg);

      // If session expired or not logged in, send user back to login
      if (/not logged in/i.test(msg)) {
        navigate("/", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Your Grades</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Your Grades</h1>
        <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {String(err)}
        </div>
        <button onClick={load} className="border px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-3">Your Grades</h1>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
{JSON.stringify(gradebook, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Attendance</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
{JSON.stringify(attendance, null, 2)}
        </pre>
      </section>
    </div>
  );
}
