import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginStudentVue, lookupDistricts } from "../api/studentvue";

export default function Login() {
  const navigate = useNavigate();

  const [districtUrl, setDistrictUrl] = useState(import.meta.env.VITE_DISTRICT_URL || "");
  const [zip, setZip] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [finding, setFinding] = useState(false);
  const [disList, setDisList] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await loginStudentVue({
        username: username.trim(),
        password,
        districtUrl: districtUrl.trim() || undefined,
      });
      // session is stored via httpOnly cookie; just navigate
      navigate("/dashboard");
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onLookup() {
    setErr(null);
    setFinding(true);
    try {
      const z = zip.trim();
      if (!z) throw new Error("Enter a ZIP code first.");
      const res = await lookupDistricts(z);
      // accept either { list: [...] } or plain array
      const list = Array.isArray(res) ? res : res?.list || [];
      setDisList(list);
      if (!list.length) setErr("No districts found for that ZIP.");
    } catch (e) {
      setErr(e?.message || "Failed to look up districts");
      setDisList(null);
    } finally {
      setFinding(false);
    }
  }

  function chooseDistrict(url) {
    setDistrictUrl(url);
    // optionally clear results after choosing
    // setDisList(null);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in with StudentVUE</h1>

      {/* District search */}
      <div className="border p-3 rounded space-y-2">
        <p className="text-sm">Don’t know your portal URL? Search by ZIP.</p>
        <div className="flex gap-2">
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
            className="border p-2 flex-1 rounded"
          />
          <button
            type="button"
            onClick={onLookup}
            disabled={finding || !zip.trim()}
            className="border px-3 py-2 rounded"
          >
            {finding ? "Finding…" : "Find"}
          </button>
        </div>

        {disList && (
          <div className="max-h-48 overflow-auto mt-2 border rounded">
            {disList.map((d, i) => {
              // support objects like {name,url} or strings (url)
              const name = typeof d === "string" ? d : d.name || d.Url || d.url || "";
              const url =
                typeof d === "string" ? d : d.url || d.Url || d.PXPURL || d.PortalUrl || d.name || "";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => chooseDistrict(url)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                  title={url}
                >
                  <div className="text-sm font-medium truncate">{name || url}</div>
                  <div className="text-xs text-gray-600 truncate">{url}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Login form */}
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          value={districtUrl}
          onChange={(e) => setDistrictUrl(e.target.value)}
          placeholder="District Portal URL (e.g., https://<district>.edupoint.com)"
          className="border p-2 w-full rounded"
          autoComplete="url"
          required
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border p-2 w-full rounded"
          autoComplete="username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full rounded"
          autoComplete="current-password"
          required
        />

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="border px-4 py-2 rounded w-full"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
