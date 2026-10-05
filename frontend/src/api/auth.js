const base = import.meta.env.VITE_API_URL || "http://localhost:8080";
async function request(path, options = {}) {
 const response = await fetch(base + "/api/auth" + path, { credentials: "include", ...options });
 const data = response.status === 204 ? null : await response.json().catch(() => ({}));
 if (!response.ok) throw new Error(data.message || data.detail || "Unable to complete the request.");
 return data;
}
export async function authPost(path, body) {
 const csrf = await request("/csrf");
 return request(path, { method: "POST", headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token }, body: JSON.stringify(body) });
}
export const currentUser = () => request("/me");
export const logout = () => authPost("/logout");
