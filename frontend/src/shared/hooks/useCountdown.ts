import { useEffect, useMemo, useState } from "react";

export function useCountdown(endsAt: number | null) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endsAt) {
      return;
    }

    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [endsAt]);

  return useMemo(() => {
    if (!endsAt) {
      return {
        remainingMs: 0,
        remainingSeconds: 0,
      };
    }

    const remainingMs = Math.max(0, endsAt - now);
    return {
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }, [endsAt, now]);
}
