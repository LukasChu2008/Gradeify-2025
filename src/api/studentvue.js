// src/api/studentvue.js
// The Vite proxy automatically forwards /api/* → backend on port 3001

// Login to StudentVUE (via backend)
export async function loginStudentVue({ username, password, districtUrl }) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, districtUrl }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

// Lookup districts by ZIP (optional direct fetch)
export async function lookupDistricts(zip) {
  try {
    const res = await fetch(
      `https://wa-bsd405-psv.edupoint.com/PXP2_Login_Student.aspx?ZipCode=${zip}`
    );
    if (!res.ok) throw new Error("Failed to lookup districts");
    return await res.json();
  } catch {
    throw new Error("Failed to lookup districts");
  }
}

// Fetch gradebook (via backend)
export async function fetchGradebook(sessionId) {
  const res = await fetch("/api/gradebook", {
    headers: { "x-session-id": sessionId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to fetch gradebook");
  return data;
}

// Fetch attendance (via backend)
export async function fetchAttendance(sessionId) {
  const res = await fetch("/api/attendance", {
    headers: { "x-session-id": sessionId },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to fetch attendance");
  return data;
}
