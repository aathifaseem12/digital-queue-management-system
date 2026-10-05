import { cloneElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { currentUser } from "./api/auth";
export default function ProtectedRoute({ role, children }) {
 const [result, setResult] = useState({ loading: true });
 useEffect(() => {
  let active = true;
  currentUser().then(user => { if (active) setResult({ user }); })
   .catch(() => { if (active) setResult({}); });
  return () => { active = false; };
 }, []);
 if (result.loading) return <p role="status">Checking your session…</p>;
 if (!result.user) return <Navigate to="/login" replace />;
 if (role && result.user.role !== role) return <Navigate to="/dashboard" replace />;
 return cloneElement(children, { user: result.user });
}
