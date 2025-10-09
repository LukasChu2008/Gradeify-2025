const base = ""; // Vite proxy sends /api to backend

export async function loginStudentVue({ username, password, districtUrl }) {
  const res = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, districtUrl })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function fetchGradebook() {
  const res = await fetch(`${base}/api/gradebook`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to fetch gradebook");
  return data;
}

export async function fetchAttendance() {
  const res = await fetch(`${base}/api/attendance`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to fetch attendance");
  return data;
}

// Only if your backend implements /api/districts. If not, remove this.
export async function lookupDistricts(zip) {
  const res = await fetch(`/api/districts?zip=${encodeURIComponent(zip)}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to lookup districts");
  return data;
}
