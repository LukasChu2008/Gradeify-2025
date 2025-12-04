import { useState } from "react";

export default function StudentVueImport() {
  const [districtUrl, setDistrictUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPreview(null);
    setLoading(true);

    try {
        const res = await fetch("/api/studentvue/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important since you use sessions
        body: JSON.stringify({ districtUrl, username, password }),
        });

        const text = await res.text(); // read raw text first

        let data;
        try {
        data = JSON.parse(text);
        } catch (e) {
        console.error("Non-JSON response from /api/studentvue/preview:", text);
        throw new Error(
            "Server did not return JSON. Check backend logs / Network tab."
        );
        }

        if (!res.ok) {
        throw new Error(data.error || "Import failed");
        }

        // For now, show whatever we got (gradebook or whole object)
        setPreview(data.gradebook || data);
    } catch (err) {
        setError(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
    };


  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Import from StudentVUE</h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}
      >
        <input
          type="text"
          placeholder="District URL (e.g. https://wa-bsd-psv.edupoint.com)"
          value={districtUrl}
          onChange={(e) => setDistrictUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="StudentVUE username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="StudentVUE password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Importing..." : "Preview Gradebook"}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 8, color: "red", fontSize: 12 }}>
          {error}
        </p>
      )}

      {preview && (
        <pre
          style={{
            marginTop: 12,
            maxHeight: 300,
            overflow: "auto",
            background: "#0b1120",
            color: "#e5e7eb",
            padding: 8,
            borderRadius: 8,
            fontSize: 11,
          }}
        >
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </div>
  );
}
