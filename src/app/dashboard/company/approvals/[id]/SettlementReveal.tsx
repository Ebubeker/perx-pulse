"use client";

import { useEffect, useState } from "react";

type Payout = { name: string; gross: number; fee: number; net: number };
const lek = (n: number) => `${n.toLocaleString("en-US")} L`;

/** Animated employer → providers money-split, revealed line by line on mount. */
export function SettlementReveal({ employer, payouts, fee, net }: { employer: number; payouts: Payout[]; fee: number; net: number }) {
  const [step, setStep] = useState(0); // 0 = nothing, 1 = employer, 2..= each payout, last = perx fee

  useEffect(() => {
    const total = payouts.length + 2; // employer + payouts + perx
    const timers = Array.from({ length: total }, (_, i) =>
      setTimeout(() => setStep((s) => Math.max(s, i + 1)), 250 + i * 450),
    );
    return () => timers.forEach(clearTimeout);
  }, [payouts.length]);

  const row = (visible: boolean) =>
    `transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <div className="mt-6">
      {/* Source */}
      <div className={`rounded-2xl bg-primary px-5 py-4 text-white ${row(step >= 1)}`}>
        <p className="text-xs uppercase tracking-wide text-white/70">Your budget paid</p>
        <p className="text-2xl font-bold">{lek(employer)}</p>
      </div>

      {/* Flow */}
      <div className="flex justify-center py-2">
        <div className={`h-6 w-px bg-line transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* Provider payouts */}
      <div className="space-y-2">
        {payouts.map((p, i) => (
          <div key={p.name} className={`flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 ${row(step >= i + 2)}`}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted">{lek(p.gross)} − Perx {lek(p.fee)}</p>
            </div>
            <span className="shrink-0 text-lg font-bold text-primary">{lek(p.net)}</span>
          </div>
        ))}
      </div>

      {/* Perx take */}
      <div className={`mt-3 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 ${row(step >= payouts.length + 2)}`}>
        <div>
          <p className="text-sm font-semibold text-accent">Perx take-rate</p>
          <p className="text-xs text-muted">{lek(net)} to providers · {lek(fee)} to Perx</p>
        </div>
        <span className="text-lg font-bold text-accent">{lek(fee)}</span>
      </div>
    </div>
  );
}
