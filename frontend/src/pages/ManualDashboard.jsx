import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  me, logout,
  listClasses, createClass, deleteClass,
  listGrades, createGrade, deleteGrade,
  listCategories, createCategory, deleteCategory, getSummary, updateGrade
} from "../api/manual";
import "./ui.css"; // NEW styling (see file below)

export default function ManualDashboard() {
  const nav = useNavigate();

  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sel, setSel] = useState(null);

  const [grades, setGrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);

  // forms
  const [cn, setCn] = useState("");
  const [cp, setCp] = useState("");
  const [ct, setCt] = useState("");

  const [gt, setGt] = useState("");
  const [ge, setGe] = useState("");
  const [gp, setGp] = useState("");
  const [gcat, setGcat] = useState("");

  const [catName, setCatName] = useState("");
  const [catWeight, setCatWeight] = useState("");

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingGrade, setEditingGrade] = useState(null);
const [editTitle, setEditTitle] = useState("");
const [editEarned, setEditEarned] = useState("");
const [editPossible, setEditPossible] = useState("");
const [editCategory, setEditCategory] = useState("");

function startEdit(grade) {
  setEditingGrade(grade);
  setEditTitle(grade.title);
  setEditEarned(grade.points_earned);
  setEditPossible(grade.points_possible);
  setEditCategory(grade.category || "");
}

async function onSaveEdit(id) {
  await updateGrade(id, {
    title: editTitle.trim(),
    points_earned: Number(editEarned),
    points_possible: Number(editPossible),
    category: editCategory.trim() || null,
  });
  setEditingGrade(null);
  const cid = currentClassId();
  await refreshClassData(cid);
}


  function currentClassId() {
    return sel?.id || classes[0]?.id || null;
  }

  // load user + classes
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

  // load class data (grades + categories + summary)
  async function refreshClassData(classId) {
    const [gr, cat, sum] = await Promise.all([
      listGrades(classId),
      listCategories(classId),
      getSummary(classId)
    ]);
    setGrades(gr.grades || []);
    setCategories(cat.categories || []);
    setSummary(sum || null);
  }

  useEffect(() => {
    const id = currentClassId();
    if (id) refreshClassData(id).catch(e => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, sel?.id]);

  // class handlers
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
    setGrades([]); setCategories([]); setSummary(null);
  }

  // grade handlers
  async function onAddGrade(e) {
    e.preventDefault();
    setErr(null);
    const id = currentClassId();
    if (!id) return;
    await createGrade(id, {
      title: gt.trim(),
      points_earned: Number(ge),
      points_possible: Number(gp),
      category: gcat.trim() || null
    });
    setGt(""); setGe(""); setGp(""); setGcat("");
    await refreshClassData(id);
  }

  async function onRemoveGrade(id) {
    await deleteGrade(id);
    const cid = currentClassId();
    if (cid) await refreshClassData(cid);
  }

  // category handlers
  async function onAddCategory(e) {
    e.preventDefault();
    setErr(null);
    const id = currentClassId();
    if (!id) return;
    await createCategory(id, {
      name: catName.trim(),
      weight_percent: Number(catWeight)
    });
    setCatName(""); setCatWeight("");
    await refreshClassData(id);
  }

  async function onRemoveCategory(id) {
    await deleteCategory(id);
    const cid = currentClassId();
    if (cid) await refreshClassData(cid);
  }

  async function onLogout() {
    await logout();
    nav("/login", { replace: true });
  }

  const cid = currentClassId();
  const selectedClass = cid && classes.find(c => c.id === cid);
  const sumWeights = summary?.sumWeights || 0;
  const overall = summary?.overallPercent;

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <header className="topbar">
        <div className="title">Gradeify</div>
        <div className="right">
          {user && <span className="muted">Signed in as <b>{user.username}</b></span>}
          <button className="btn" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      {err && <div className="alert">{err}</div>}

      <section className="card">
        <div className="card-title">Your Classes</div>
        <div className="pills">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSel(c)}
              className={`pill ${sel?.id === c.id ? "active" : ""}`}
              title={c.teacher || ""}
            >
              {c.period ? `${c.period}. ` : ""}{c.name}
            </button>
          ))}
        </div>

        <form onSubmit={onAddClass} className="grid4 mt">
          <input className="input" placeholder="Class name" value={cn} onChange={e => setCn(e.target.value)} required />
          <input className="input" placeholder="Period (optional)" inputMode="numeric" value={cp} onChange={e => setCp(e.target.value)} />
          <input className="input" placeholder="Teacher (optional)" value={ct} onChange={e => setCt(e.target.value)} />
          <button className="btn">Add class</button>
        </form>

        {selectedClass && (
          <button className="link-danger mt" onClick={() => onRemoveClass(selectedClass.id)}>
            Remove selected class
          </button>
        )}
      </section>

      <div className="grid2">
        <section className="card">
          <div className="card-title">
            {selectedClass ? `Weights for: ${selectedClass.name}` : "Add a class to begin"}
          </div>

          {selectedClass && (
            <>
              <div className="weights">
                <div className="weights-list">
                  {categories.length === 0 ? (
                    <div className="muted">No categories yet — add some below (They can sum to 100 later).</div>
                  ) : (
                    categories.map(c => (
                      <div key={c.id} className="row">
                        <div className="grow">{c.name}</div>
                        <div className="muted">{c.weight_percent}%</div>
                        <button className="link-danger" onClick={() => onRemoveCategory(c.id)}>Remove</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="progress">
                  <div className="progress-bar" style={{ width: `${Math.min(sumWeights, 100)}%` }} />
                </div>
                <div className={`muted ${sumWeights === 100 ? "ok" : ""}`}>
                  Total weights: {sumWeights}% {sumWeights !== 100 && "(They’ll be normalized until you hit 100%)"}
                </div>
              </div>

              <form onSubmit={onAddCategory} className="grid3 mt">
                <input className="input" placeholder="Category name (e.g., Homework)" value={catName} onChange={e => setCatName(e.target.value)} required />
                <input className="input" placeholder="Weight %" inputMode="decimal" value={catWeight} onChange={e => setCatWeight(e.target.value)} required />
                <button className="btn">Add category</button>
              </form>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            {selectedClass ? `Overall Grade: ${overall != null ? `${overall.toFixed(1)}%` : "—"}` : "Overall Grade"}
          </div>

          {summary?.categories?.length ? (
            <div className="cat-table">
              <div className="thead">
                <div>Category</div>
                <div>Weight</div>
                <div>Earned</div>
                <div>Possible</div>
                <div>%</div>
              </div>
              {summary.categories.map((c, i) => (
                <div key={`${c.name}-${i}`} className="trow">
                  <div>{c.name}</div>
                  <div>{c.weight_percent}%</div>
                  <div>{c.earned}</div>
                  <div>{c.possible}</div>
                  <div>{c.percent != null ? c.percent.toFixed(1) + "%" : "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">Add categories and grades to see an overall.</div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-title">
          {selectedClass ? `Grades for: ${selectedClass.name}` : "Add a class to begin"}
        </div>

        {selectedClass && (
          <>
            <form onSubmit={onAddGrade} className="grid5">
              <input className="input" placeholder="Assignment title" value={gt} onChange={e => setGt(e.target.value)} required />
              <input className="input" placeholder="Earned" value={ge} onChange={e => setGe(e.target.value)} inputMode="decimal" required />
              <input className="input" placeholder="Possible" value={gp} onChange={e => setGp(e.target.value)} inputMode="decimal" required />
              <select className="input" value={gcat} onChange={e => setGcat(e.target.value)}>
                <option value="">— Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button className="btn">Add grade</button>
            </form>

            <div className="table mt">
              <div className="thead">
                <div>Title</div>
                <div>Earned</div>
                <div>Possible</div>
                <div>%</div>
                <div>Category</div>
                <div></div>
              </div>
              {grades.length === 0 ? (
  <div className="muted mt">No grades yet.</div>
) : (
  grades.map(g => {
    const pct = g.points_possible > 0 ? (g.points_earned / g.points_possible) * 100 : 0;
    const isEditing = editingGrade?.id === g.id;

    return (
      <div key={g.id} className="trow">
        {isEditing ? (
          <>
            <input
              className="input small"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
            />
            <input
              className="input small"
              value={editEarned}
              onChange={e => setEditEarned(e.target.value)}
              inputMode="decimal"
            />
            <input
              className="input small"
              value={editPossible}
              onChange={e => setEditPossible(e.target.value)}
              inputMode="decimal"
            />
            <select
              className="input small"
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
            >
              <option value="">— Category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div>
              <button className="link" onClick={() => onSaveEdit(g.id)}>Save</button>
              <button className="link-danger" onClick={() => setEditingGrade(null)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div>{g.title}</div>
            <div>{g.points_earned}</div>
            <div>{g.points_possible}</div>
            <div>{pct.toFixed(1)}%</div>
            <div>{g.category || "—"}</div>
            <div>
              <button className="link" onClick={() => startEdit(g)}>Edit</button>
              <button className="link-danger" onClick={() => onRemoveGrade(g.id)}>Remove</button>
            </div>
          </>
        )}
      </div>
    );
  })
)}

            </div>
          </>
        )}
      </section>
    </div>
  );
}
