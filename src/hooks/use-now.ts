import { useEffect, useState } from "react";

// Ticks every `intervalMs` and returns the current epoch ms. Used to drive
// live timers. Pass `active=false` to freeze the clock (no re-renders).
export function useNow(active: boolean = true, intervalMs: number = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
