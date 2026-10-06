import { useCallback, useEffect, useRef, useState } from "react";
export default function useDashboard(loader) {
 const [data, setData] = useState(null);
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(true);
 const sequence = useRef({ id: 0, active: false });
 const refresh = useCallback(async () => {
  const state = sequence.current;
  const request = ++state.id;
  try {
   const next = await loader();
   if (state.active && request === state.id) { setData(next); setError(""); setLoading(false); }
  } catch (failure) {
   if (state.active && request === state.id) { setError(failure.message); setLoading(false); }
  }
 }, [loader]);
 useEffect(() => {
  const state = sequence.current;
  state.active = true;
  const start = window.setTimeout(refresh, 0);
  const interval = window.setInterval(refresh, 5000);
  return () => { window.clearTimeout(start); window.clearInterval(interval); state.active = false; state.id++; };
 }, [refresh]);
 return { data, error, loading, refresh };
}
