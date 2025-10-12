// frontend/src/api/studentvue.js

// Use VITE_API_BASE if provided (e.g., when deploying), otherwise rely on Vite's dev proxy.
const API_BASE = (import.meta?.env?.VITE_API_BASE ?? "").trim();

/**
 * Small fetch helper with timeout, JSON parsing, and consistent error surfacing.
 */
async function request(path, { method = "GET", body, headers, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const opts = {
    method,
    credentials: "include", // send/receive httpOnly session cookie
    signal: controller.signal,
    headers: headers || {},
  };

  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!opts.headers["Content-Type"]) {
      opts.headers["Content-Type"] = "application/json";
    }
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    // try to parse JSON; if it fails, fall back to text
    let data;
    try {
      data = await res.json();
    } catch {
      data = { raw: await res.text() };
    }
    if (!res.ok) {
      const msg = (data && (data.error || data.message || data.raw)) || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    // Network errors, DNS, CORS, etc.
    throw new Error(err?.message || "Network error");
  } finally {
    clearTimeout(timer);
  }
}

export async function loginStudentVue({ username, password, districtUrl }) {
  return request("/api/login", {
    method: "POST",
    body: { username, password, districtUrl },
  });
}

export async function fetchGradebook() {
  return request("/api/gradebook");
}

export async function fetchAttendance() {
  return request("/api/attendance");
}

export async function lookupDistricts(zip) {
  const q = encodeURIComponent(String(zip ?? "").trim());
  return request(`/api/districts?zip=${q}`);
}

export async function logout() {
  return request("/api/logout", { method: "POST" });
}
