// src/pages/DashboardLayout.jsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  const handleSignOut = () => {
    localStorage.removeItem("gradeify_user"); // adjust key if needed
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="logo">Gradeify</h1>

        <nav className="nav">
          <Link to="/app" className={isActive("/app")}>
            Welcome
          </Link>
          <Link to="/app/classes" className={isActive("/app/classes")}>
            Classes
          </Link>
          <Link to="/app/learn" className={isActive("/app/learn")}>
            Learn (soon)
          </Link>
          <Link to="/app/tools" className={isActive("/app/tools")}>
            Tools (soon)
          </Link>
          <Link to="/app/settings" className={isActive("/app/settings")}>
            Settings
          </Link>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
