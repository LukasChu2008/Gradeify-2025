// src/api/studentvue.js
const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  'https://8080-urban-space-pancake-p4rpx5rw7xpfr56v-5173.app.github.dev';

// Login to StudentVUE
export async function loginStudentVue({ username, password, districtUrl }) {
  const res = await fetch(`${BACKEND_URL}/api/studentvue/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, districtUrl }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Login failed');
  }
  return await res.json();
}

// Lookup districts by ZIP
export async function lookupDistricts(zip) {
  const res = await fetch(`${BACKEND_URL}/api/studentvue/districts?zip=${zip}`);
  if (!res.ok) throw new Error('Failed to lookup districts');
  return await res.json();
}

// Fetch gradebook for a session
export async function fetchGradebook(sessionId) {
  const res = await fetch(`${BACKEND_URL}/api/studentvue/gradebook`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch gradebook');
  }
  return await res.json();
}

// Fetch attendance for a session
export async function fetchAttendance(sessionId) {
  const res = await fetch(`${BACKEND_URL}/api/studentvue/attendance`, {
    headers: { 'x-session-id': sessionId },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch attendance');
  }
  return await res.json();
}
