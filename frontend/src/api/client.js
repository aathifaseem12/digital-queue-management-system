const base = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
export async function apiGet(path, options = {}) {
 const response = await fetch(base + "/api" + path, { ...options, credentials: "include" });
 const data = response.status === 204 ? null : await response.json().catch(() => ({}));
 if (!response.ok) {
  const error = new Error(data.message || data.detail || "Unable to complete the request.");
  error.status = response.status;
  throw error;
 }
 return data;
}
export async function apiPost(path, body) {
 const csrf = await apiGet("/auth/csrf");
 return apiGet(path, { method: "POST", headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token }, body: JSON.stringify(body) });
}
