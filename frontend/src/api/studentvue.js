const base = ""; // Vite proxy handles /api

export async function loginStudentVue({ username, password, districtUrl }) {
  const res = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, districtUrl }),
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
