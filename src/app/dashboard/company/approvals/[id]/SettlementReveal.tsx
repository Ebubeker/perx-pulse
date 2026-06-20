"use client";

import { useEffect, useState } from "react";
import { toCoins } from "@/lib/currency";

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
      {/* Source — coins spent from budget */}
      <div className={`card-dark ${row(step >= 1)}`}>
        <div className="blob" />
        <div className="relative z-[2]">
          <p className="kicker text-lime-deep">PerxCoins spent</p>
          <p className="mt-1 font-display text-3xl font-bold text-lime">{toCoins(employer).toLocaleString("en-US")} coins</p>
          <p className="mt-1 text-xs text-[var(--txt-on-dark-mut)]">settled as {lek(employer)} cash to providers</p>
        </div>
      </div>

      {/* Flow */}
      <div className="flex justify-center py-2">
        <div className={`h-6 w-px bg-line transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* Provider payouts (real cash, in Lek) */}
      <div className="space-y-2">
        {payouts.map((p, i) => (
          <div key={p.name} className={`flex items-center gap-3 rounded-[18px] border border-line bg-paper px-4 py-3 ${row(step >= i + 2)}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted">{lek(p.gross)} − Perx {lek(p.fee)}</p>
            </div>
            <span className="shrink-0 font-display text-lg font-bold text-coral">{lek(p.net)}</span>
          </div>
        ))}
      </div>

      {/* Perx take */}
      <div className={`mt-3 flex items-center justify-between gap-3 rounded-[18px] border border-coral/30 bg-coral-soft px-4 py-3 ${row(step >= payouts.length + 2)}`}>
        <div>
          <p className="text-sm font-semibold text-coral-deep">Perx take-rate</p>
          <p className="text-xs text-muted">{lek(net)} to providers · {lek(fee)} to Perx</p>
        </div>
        <span className="font-display text-lg font-bold text-coral-deep">{lek(fee)}</span>
      </div>
    </div>
  );
}
