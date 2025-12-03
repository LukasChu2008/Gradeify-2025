// src/components/PracticeGenerator.jsx
import { useState } from "react";

const sectionCard = {
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  padding: "16px 18px",
  marginBottom: "16px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #d4d4d8",
  fontSize: "14px",
  outline: "none",
};

const selectStyle = { ...inputStyle };
const smallText = { fontSize: "12px", color: "#6b7280" };

const primaryButton = {
  padding: "8px 14px",
  borderRadius: "999px",
  border: "none",
  background: "#4f46e5",
  color: "white",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton = {
  ...primaryButton,
  background: "#059669",
};

const questionCard = {
  background: "white",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  padding: "12px 14px",
};

export default function PracticeGenerator() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState("");

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setTestData(null);
    setSelectedAnswers({});
    setSubmitted(false);
    setResults(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          difficulty,
          numQuestions: Number(numQuestions),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate practice test");
      }

      const data = await res.json();
      setTestData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceChange = (questionId, value) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswers = () => {
    if (!testData?.questions?.length) return;

    let correctCount = 0;
    const perQuestion = testData.questions.map((q) => {
      const userAnswer = selectedAnswers[q.id];
      const correctAnswer = String(q.answer ?? "").trim().toLowerCase();
      const userNorm = String(userAnswer ?? "").trim().toLowerCase();
      const isCorrect = !!userAnswer && userNorm === correctAnswer;
      if (isCorrect) correctCount++;
      return { id: q.id, correct: isCorrect, userAnswer };
    });

    setResults({
      score: correctCount,
      total: testData.questions.length,
      perQuestion,
    });
    setSubmitted(true);
  };

  const getQuestionResult = (id) =>
    results?.perQuestion?.find((r) => r.id === id) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Generator card */}
      <section style={sectionCard}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
          AI Practice Test Generator
        </h2>

        <form
          onSubmit={handleGenerate}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {/* subject & topic */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>Subject (e.g., AP Calculus BC)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Topic (e.g., parametrics)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* difficulty / number / button */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 140px 160px",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={selectStyle}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Number of questions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButton,
                  width: "100%",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "default" : "pointer",
                }}
              >
                {loading ? "Generating..." : "Generate Practice Test"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div
            style={{
              marginTop: "8px",
              padding: "6px 8px",
              borderRadius: "10px",
              border: "1px solid #fecaca",
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}
      </section>

      {/* Quiz card */}
      {testData && (
        <section style={{ ...sectionCard, background: "#f3f4f6" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "8px",
              gap: "12px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "2px",
                }}
              >
                {testData.subject} – {testData.topic} ({testData.difficulty})
              </h3>
              <p style={smallText}>
                Select your answers, then click{" "}
                <strong>Submit Answers</strong> to see your score.
              </p>
            </div>

            {results && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  Score: {results.score} / {results.total}
                </div>
                <div style={smallText}>
                  {Math.round((results.score / results.total) * 100)}%
                </div>
              </div>
            )}
          </div>

          <ol
            style={{
              listStyle: "decimal",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {testData.questions?.map((q) => {
              const result = getQuestionResult(q.id);
              const isCorrect = result?.correct;
              const userAnswer = selectedAnswers[q.id];

              let borderColor = "#e5e7eb";
              if (submitted && isCorrect === true) borderColor = "#4ade80";
              if (submitted && isCorrect === false) borderColor = "#f97373";

              return (
                <li key={q.id}>
                  <div style={{ ...questionCard, borderColor }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "6px",
                        }}
                      >
                        {q.question}
                      </p>
                      {submitted && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: isCorrect ? "#dcfce7" : "#fee2e2",
                            color: isCorrect ? "#166534" : "#b91c1c",
                            alignSelf: "flex-start",
                          }}
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </div>

                    {/* choices or free response */}
                    {q.choices && q.choices.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {q.choices.map((choice, idx) => (
                          <label
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              cursor: submitted ? "default" : "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              value={choice}
                              disabled={submitted}
                              checked={userAnswer === choice}
                              onChange={() =>
                                handleChoiceChange(q.id, choice)
                              }
                            />
                            <span>{choice}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        style={{ ...inputStyle, marginTop: "4px" }}
                        value={userAnswer || ""}
                        disabled={submitted}
                        onChange={(e) =>
                          handleChoiceChange(q.id, e.target.value)
                        }
                      />
                    )}

                    {/* explanation after submit */}
                    {submitted && (
                      <div style={{ marginTop: "6px", fontSize: "12px" }}>
                        <p>
                          <strong>Correct answer:</strong>{" "}
                          {String(q.answer)}
                        </p>
                        {q.explanation && (
                          <p style={{ marginTop: "3px" }}>
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {!submitted && testData.questions?.length > 0 && (
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <button
                type="button"
                onClick={handleSubmitAnswers}
                style={secondaryButton}
              >
                Submit Answers
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
