const BASE = import.meta.env.VITE_API_URL || ""; // e.g., "/api"

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const updateProfile = (body) =>
  req("/api/user/profile", { method: "PATCH", body });

export const updatePassword = (body) =>
  req("/api/user/password", { method: "PATCH", body });

export const updatePreferences = (body) =>
  req("/api/user/preferences", { method: "PATCH", body });
