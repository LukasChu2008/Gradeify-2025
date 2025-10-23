import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { updateProfile, updatePassword, updatePreferences } from "../api/userApi";

export default function SettingsPage() {
  const {
    prefs, setTheme, setTextScale, setHighContrast, setReduceMotion,
    profile, setDisplayName
  } = useSettings();

  // local form state
  const [displayName, setDisplayNameInput] = useState(profile.displayName || "");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      await updateProfile({ displayName });
      setDisplayName(displayName);
      setMsg("Profile updated.");
    } catch (e2) { setMsg(e2.message || "Failed to update profile."); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return setMsg("New passwords do not match.");
    if (!newPw || newPw.length < 8) return setMsg("Password must be at least 8 characters.");
    setSaving(true); setMsg("");
    try {
      await updatePassword({ currentPassword: curPw, newPassword: newPw });
      setCurPw(""); setNewPw(""); setConfirmPw("");
      setMsg("Password updated.");
    } catch (e2) { setMsg(e2.message || "Failed to update password."); }
    finally { setSaving(false); }
  };

  const savePrefs = async () => {
    setSaving(true); setMsg("");
    try {
      await updatePreferences(prefs);
      setMsg("Preferences saved.");
    } catch (e2) { setMsg(e2.message || "Failed to save preferences."); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-10">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <div className="flex gap-3">
          {["light","dark","system"].map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`border rounded px-3 py-2 ${prefs.theme===t ? "border-blue-500" : "border-gray-300"}`}
              aria-pressed={prefs.theme===t}
            >{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Accessibility</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3">
            <span className="w-40">Text Size</span>
            <select
              value={prefs.textScale}
              onChange={(e)=>setTextScale(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="sm">Small</option>
              <option value="md">Default</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={prefs.highContrast} onChange={(e)=>setHighContrast(e.target.checked)} />
            <span>High contrast</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={prefs.reduceMotion} onChange={(e)=>setReduceMotion(e.target.checked)} />
            <span>Reduce motion</span>
          </label>
        </div>
        <button onClick={savePrefs} disabled={saving} className="mt-2 rounded bg-blue-600 text-white px-4 py-2">
          Save Appearance & Accessibility
        </button>
      </section>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="grid gap-3 max-w-md">
          <label className="grid gap-1">
            <span>Display name</span>
            <input
              className="border rounded px-3 py-2"
              value={displayName}
              onChange={(e)=>setDisplayNameInput(e.target.value)}
              placeholder="e.g., Kounish"
            />
          </label>
          <button disabled={saving} className="rounded bg-blue-600 text-white px-4 py-2 w-fit">
            Save Profile
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Change Password</h2>
        <form onSubmit={savePassword} className="grid gap-3 max-w-md">
          <input
            className="border rounded px-3 py-2"
            type="password" value={curPw} onChange={(e)=>setCurPw(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <input
            className="border rounded px-3 py-2"
            type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
          />
          <input
            className="border rounded px-3 py-2"
            type="password" value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          <button disabled={saving} className="rounded bg-blue-600 text-white px-4 py-2 w-fit">
            Update Password
          </button>
        </form>
      </section>

      {msg && <p role="status" className="text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
