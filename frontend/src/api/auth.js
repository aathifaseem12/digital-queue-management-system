import { apiGet, apiPost } from "./client";
export const authPost = (path, body) => apiPost("/auth" + path, body);
export const currentUser = () => apiGet("/auth/me");
export const logout = () => authPost("/logout");
