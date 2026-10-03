import { useEffect, useState } from 'react';

/** Re-render every `ms` milliseconds — used for live countdowns. */
export function useNow(ms = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function minutesUntil(date: Date, now: number) {
  return Math.max(0, Math.round((date.getTime() - now) / 60_000));
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
