import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  me, logout,
  listClasses, createClass, deleteClass,
  listGrades, createGrade, deleteGrade
} from "../api/manual";

export default function ManualDashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sel, setSel] = useState(null);
  const [grades, setGrades] = useState([]);
  const [cn, setCn] = useState("");
  const [cp, setCp] = useState("");
  const [ct, setCt] = useState("");
  const [gt, setGt] = useState("");
  const [ge, setGe] = useState("");
  const [gp, setGp] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const u = await me();
      if (!u?.user) return nav("/login", { replace: true });
      setUser(u.user);
      const cls = await listClasses();
      setClasses(cls.classes || []);
      setLoading(false);
    })().catch(e => { setErr(e.message); setLoading(false); });
  }, [nav]);

  async function refreshGrades(classId) {
    const res = await listGrades(classId);
    setGrades(res.grades || []);
  }

  function currentClassId() {
    return sel?.id || classes[0]?.id || null;
  }

  useEffect(() => {
    const id = currentClassId();
    if (id) refreshGrades(id).catch(e => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, sel?.id]);

  async function onAddClass(e) {
    e.preventDefault();
    setErr(null);
    const res = await createClass({
      name: cn.trim(),
      period: cp ? Number(cp) : null,
      teacher: ct.trim() || null
    });
    setCn(""); setCp(""); setCt("");
    const cls = await listClasses();
    setClasses(cls.classes || []);
    setSel(res.class);
  }

  async function onRemoveClass(id) {
    await deleteClass(id);
    const cls = await listClasses();
    setClasses(cls.classes || []);
    setSel(null);
    setGrades([]);
  }

  async function onAddGrade(e) {
    e.preventDefault();
    setErr(null);
    const id = currentClassId();
    if (!id) return;
    await createGrade(id, {
      title: gt.trim(),
      points_earned: Number(ge),
      points_possible: Number(gp)
    });
    setGt(""); setGe(""); setGp("");
    await refreshGrades(id);
  }

  async function onRemoveGrade(id) {
    await deleteGrade(id);
    const cid = currentClassId();
    if (cid) await refreshGrades(cid);
  }

  async function onLogout() {
    await logout();
    nav("/login", { replace: true });
  }

  const cid = currentClassId();
  const selectedClass = cid && classes.find(c => c.id === cid);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manual Grades</h1>
        <div className="text-sm">
          {user && <span className="mr-3">Signed in as <b>{user.username}</b></span>}
          <button onClick={onLogout} className="border px-3 py-1 rounded">Sign out</button>
        </div>
      </header>

      {err && <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">{err}</div>}

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Your Classes</h2>

        <div className="flex gap-2 flex-wrap">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSel(c)}
              className={`border px-3 py-1 rounded ${sel?.id === c.id ? "bg-gray-200" : ""}`}
            >
              {c.period ? `${c.period}. ` : ""}{c.name}
            </button>
          ))}
        </div>

        <form onSubmit={onAddClass} className="mt-3 grid gap-2 sm:grid-cols-4">
          <input className="border p-2 rounded" placeholder="Class name"
                 value={cn} onChange={e => setCn(e.target.value)} required />
          <input className="border p-2 rounded" placeholder="Period (optional)" inputMode="numeric"
                 value={cp} onChange={e => setCp(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Teacher (optional)"
                 value={ct} onChange={e => setCt(e.target.value)} />
          <button className="border px-3 py-2 rounded">Add class</button>
        </form>

        {selectedClass && (
          <button className="mt-2 text-sm text-red-600 underline"
                  onClick={() => onRemoveClass(selectedClass.id)}>
            Remove selected class
          </button>
        )}
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">
          {selectedClass ? `Grades for: ${selectedClass.name}` : "Add a class to begin"}
        </h2>

        {selectedClass && (
          <>
            <form onSubmit={onAddGrade} className="grid gap-2 sm:grid-cols-4">
              <input className="border p-2 rounded" placeholder="Assignment title"
                     value={gt} onChange={e => setGt(e.target.value)} required />
              <input className="border p-2 rounded" placeholder="Points earned"
                     value={ge} onChange={e => setGe(e.target.value)} inputMode="decimal" required />
              <input className="border p-2 rounded" placeholder="Points possible"
                     value={gp} onChange={e => setGp(e.target.value)} inputMode="decimal" required />
              <button className="border px-3 py-2 rounded">Add grade</button>
            </form>

            <div className="mt-3">
              {grades.length === 0 ? (
                <p className="text-sm text-gray-600">No grades yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-1 pr-2">Title</th>
                      <th className="py-1 pr-2">Earned</th>
                      <th className="py-1 pr-2">Possible</th>
                      <th className="py-1 pr-2">%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(g => {
                      const pct = g.points_possible > 0 ? (g.points_earned / g.points_possible) * 100 : 0;
                      return (
                        <tr key={g.id} className="border-b">
                          <td className="py-1 pr-2">{g.title}</td>
                          <td className="py-1 pr-2">{g.points_earned}</td>
                          <td className="py-1 pr-2">{g.points_possible}</td>
                          <td className="py-1 pr-2">{pct.toFixed(1)}%</td>
                          <td className="py-1">
                            <button className="text-red-600 underline" onClick={() => onRemoveGrade(g.id)}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}