// src/pages/Learn.jsx
import PracticeGenerator from "../components/PracticeGenerator";

const pageStyle = {
  padding: "32px",
};

const cardStyle = {
  maxWidth: "960px",
  margin: "0 auto",
  background: "rgba(255,255,255,0.95)",
  borderRadius: "24px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
  padding: "24px 28px 30px",
};

const headingStyle = {
  fontSize: "28px",
  fontWeight: 700,
  marginBottom: "4px",
};

const subheadingStyle = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "20px",
};

export default function LearnPage() {
  return (
    <div style={pageStyle}>
      <section style={cardStyle}>
        <h1 style={headingStyle}>Learn – Practice Generator</h1>
        <p style={subheadingStyle}>
          Generate custom practice sets, answer the questions, and then check
          your score at the end.
        </p>

        <PracticeGenerator />
      </section>
    </div>
  );
}
