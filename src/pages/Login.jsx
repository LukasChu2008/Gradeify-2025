import { useState } from 'react';
import { loginStudentVue, lookupDistricts } from '../api/studentvue';

export default function Login() {
  const [districtUrl, setDistrictUrl] = useState(import.meta.env.VITE_DISTRICT_URL || '');
  const [zip, setZip] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disList, setDisList] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await loginStudentVue({ username, password, districtUrl: districtUrl || undefined });
      // Save session ID for later use in dashboard
      localStorage.setItem('sv-session-id', data.sessionId);
      window.location.href = '/dashboard';
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function onLookup() {
    setErr(null);
    try {
      const res = await lookupDistricts(zip);
      setDisList(res.list);
    } catch (e) {
      setErr('Failed to lookup districts');
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Sign in with StudentVUE</h1>

      <div className="border p-3 rounded">
        <p className="mb-2">Don’t know your portal URL? Search by ZIP.</p>
        <div className="flex gap-2">
          <input
            value={zip}
            onChange={e => setZip(e.target.value)}
            placeholder="ZIP code"
            className="border p-2 flex-1"
          />
          <button type="button" onClick={onLookup} className="border px-3">
            Find
          </button>
        </div>
        {disList && (
          <ul className="mt-2 list-disc pl-5">
            {(disList?.DistrictLists?.DistrictInfos?.DistrictInfo || []).map((d, i) => (
              <li key={i}>
                <button
                  className="underline text-blue-600"
                  onClick={() => setDistrictUrl(d.PvueURL)}
                >
                  {d.Name} — {d.PvueURL}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          value={districtUrl}
          onChange={e => setDistrictUrl(e.target.value)}
          placeholder="District Portal URL (optional)"
          className="border p-2 w-full"
        />
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="StudentVUE Username"
          className="border p-2 w-full"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="border p-2 w-full"
        />
        {err && <p className="text-red-600">{err}</p>}
        <button disabled={loading} className="border px-4 py-2">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
