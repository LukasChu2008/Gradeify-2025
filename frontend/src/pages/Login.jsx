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

  const canSubmit =
    districtUrl.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length > 0 &&
    !loading;

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
      const res = await lookupDistricts(z); // requires backend route
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
    if (!url) return;
    setDistrictUrl(String(url).trim());
    // optionally clear results after choosing:
    // setDisList(null);
  }

  // Helpful tips when error suggests SSO / D21xx
  const showSsoTips =
    typeof err === "string" &&
    (/single sign-on/i.test(err) || /critical error|D21/i.test(err));

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in with StudentVUE</h1>

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
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLookup}
            disabled={finding || !zip.trim()}
            className="border px-3 py-2 rounded"
          >
            {finding ? "Finding…" : "Find"}
          </button>
          {disList && disList.length > 0 && (
            <button
              type="button"
              onClick={() => setDisList(null)}
              className="border px-3 py-2 rounded"
              title="Clear results"
            >
              Clear
            </button>
          )}
        </div>

        {disList && (
          <div className="max-h-52 overflow-auto mt-2 border rounded divide-y">
            {disList.map((d, i) => {
              // support objects like {name,url} or strings (url)
              const name = typeof d === "string" ? d : d.name || d.Url || d.url || d.PortalName || "";
              const url =
                typeof d === "string"
                  ? d
                  : d.url || d.Url || d.PXPURL || d.PortalUrl || d.name || "";

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

        {err && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
            {err}
            {showSsoTips && (
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirm this is the exact StudentVUE portal URL for your district.</li>
                <li>
                  If the portal login page shows “Sign in with Google/Microsoft,” the district requires SSO and
                  password login via API isn’t supported.
                </li>
                <li>If you still can’t log in on the district portal, the account may need activation or a reset.</li>
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="border px-4 py-2 rounded w-full disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
