"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(ms: number) {
  ms = Math.max(0, ms);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

/** A live, ticking countdown. `hero` shows big HH:MM:SS; `chip` shows a compact "2d 3h" / "HH:MM:SS left". */
export function Countdown({ endsAt, variant = "chip" }: { endsAt: string; variant?: "chip" | "hero" }) {
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null); // null until mounted → stable SSR/first-paint markup

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span className="tabular-nums">{variant === "hero" ? "--:--:--" : "…"}</span>;

  const ms = target - now;
  if (ms <= 0) return <span className="tabular-nums">{variant === "hero" ? "00:00:00" : "ended"}</span>;

  const { d, h, m, s } = parts(ms);
  if (variant === "hero") {
    const totalH = Math.min(d * 24 + h, 99);
    return <span className="tabular-nums">{pad(totalH)}:{pad(m)}:{pad(s)}</span>;
  }
  if (d >= 1) return <span>{d}d {h}h left</span>;
  return <span className="tabular-nums">{pad(h)}:{pad(m)}:{pad(s)} left</span>;
}
