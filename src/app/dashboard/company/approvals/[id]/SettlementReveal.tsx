"use client";

import { useEffect, useState } from "react";
import { toCoins } from "@/lib/currency";

type Payout = { name: string; gross: number; fee: number; net: number };
const lek = (n: number) => `${n.toLocaleString("en-US")} L`;

/** Per-provider settlement split (the design's `.flow` rows), revealed line by line on mount. */
export function SettlementReveal({ employer, payouts, fee, net }: { employer: number; payouts: Payout[]; fee: number; net: number }) {
  const [step, setStep] = useState(0); // 0 = nothing, 1..= each payout, last = perx take

  useEffect(() => {
    const total = payouts.length + 1; // payouts + perx
    const timers = Array.from({ length: total }, (_, i) =>
      setTimeout(() => setStep((s) => Math.max(s, i + 1)), 250 + i * 450),
    );
    return () => timers.forEach(clearTimeout);
  }, [payouts.length]);

  const reveal = (visible: boolean) =>
    `transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <div className="card">
      <h3 className="display" style={{ fontSize: 17, marginBottom: 10 }}>
        Payment split ({toCoins(employer).toLocaleString("en-US")} coins → {lek(net)})
      </h3>
      {payouts.map((p, i) => (
        <div key={p.name} className={`flow ${reveal(step >= i + 1)}`}>
          <span className="amt">{lek(p.net)}</span>
          <span className="arrow">→</span>
          <span className="to truncate">{p.name}</span>
        </div>
      ))}
      <div className={`flow ${reveal(step >= payouts.length + 1)}`} style={{ marginBottom: 0 }}>
        <span className="amt">{lek(fee)}</span>
        <span className="arrow">→</span>
        <span className="to">Perx take-rate</span>
      </div>
    </div>
  );
}
