// src/pages/WelcomePage.jsx
import { Link } from "react-router-dom";

export default function WelcomePage() {
  return (
    <div
      style={{
        background: "var(--bg-soft)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--text)" }}>
        Welcome to Gradeify 👋
      </h2>

      <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
        Track your grades, test what-if scenarios, and soon get study tools and
        tips tailored to your classes.
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid var(--accent-soft)",
            background: "var(--bg-soft)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "var(--text)" }}>
            1. Add / view your classes
          </h3>

          <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--text-muted)" }}>
            Manage your current courses, weights, and assignments.
          </p>

          <Link
            to="/app/classes"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "var(--accent)",
              color: "white",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Go to Classes →
          </Link>
        </div>

        {/* Card 2 */}
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid var(--accent-soft)",
            background: "var(--bg-soft)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "var(--text)" }}>
            What-if grade calculator
          </h3>

          <p style={{ fontSize: "0.9rem", marginBottom: 0, color: "var(--text-muted)" }}>
            See what score you need on your next test or final to hit a target grade.
            (Coming soon.)
          </p>
        </div>

        {/* Card 3 */}
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid var(--accent-soft)",
            background: "var(--bg-soft)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "var(--text)" }}>
            Study tips & resources
          </h3>

          <p style={{ fontSize: "0.9rem", marginBottom: 0, color: "var(--text-muted)" }}>
            Get study ideas based on which classes you're struggling in.
            (This is where your new educational features will go.)
          </p>
        </div>
      </div>
    </div>
  );
}
