// src/components/PracticeGenerator.jsx
import { useState } from "react";

export default function PracticeGenerator() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTestData(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">AI Practice Test Generator</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl">
        <div>
          <label className="block text-sm font-medium mb-1">
            Subject (e.g., AP Calculus BC)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="AP Calculus BC"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Topic (e.g., parametrics)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Parametric equations"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg border font-semibold disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Practice Test"}
        </button>
      </form>

      {error && (
        <div className="text-red-600 text-sm border border-red-200 p-2 rounded">
          {error}
        </div>
      )}

      {testData && (
        <div className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">
            {testData.subject} – {testData.topic} ({testData.difficulty})
          </h2>

          <ol className="space-y-4 list-decimal list-inside">
            {testData.questions?.map((q) => (
              <li key={q.id} className="border p-3 rounded-lg">
                <p className="font-medium mb-2">{q.question}</p>

                {q.choices && q.choices.length > 0 && (
                  <ul className="list-disc list-inside ml-4 mb-2 text-sm">
                    {q.choices.map((choice, idx) => (
                      <li key={idx}>{choice}</li>
                    ))}
                  </ul>
                )}

                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer font-semibold">
                    Show Answer & Explanation
                  </summary>
                  <p className="mt-1">
                    <span className="font-semibold">Answer: </span>
                    {q.answer}
                  </p>
                  {q.explanation && (
                    <p className="mt-1">
                      <span className="font-semibold">Explanation: </span>
                      {q.explanation}
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
