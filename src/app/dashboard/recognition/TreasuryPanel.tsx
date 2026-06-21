"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { topUpTreasury, distributeMonthlySpread } from "@/lib/treasury-actions";
import { CoinIcon } from "@/components/CoinIcon";
import { Icon } from "@/components/Icon";

const PRESETS = [500, 1000, 5000];

export function TreasuryPanel({
  spread,
  employeeCount,
  distributed,
}: {
  spread: number;
  employeeCount: number;
  distributed: boolean;
}) {
  const router = useRouter();
  const [coins, setCoins] = useState(1000);
  const [pendingTopUp, startTopUp] = useTransition();
  const [pendingDist, startDist] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  const lek = (coins || 0) * 100;
  const monthlyDraw = spread * employeeCount;

  function buy() {
    setMsg(null);
    startTopUp(async () => {
      const res = await topUpTreasury(coins);
      if (res.error) setMsg({ text: res.error });
      else { setMsg({ ok: true, text: `Bought ${coins.toLocaleString("en-US")} coins ✓` }); router.refresh(); }
    });
  }

  function distribute() {
    setMsg(null);
    startDist(async () => {
      const res = await distributeMonthlySpread();
      if (res.error) setMsg({ text: res.error });
      else { setMsg({ ok: true, text: `Distributed ${res.total?.toLocaleString("en-US")} coins to ${res.count} ${res.count === 1 ? "employee" : "employees"} ✓` }); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Buy coins into the treasury */}
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="ico shrink-0"><Icon name="piggy" size={20} /></span>
          <div>
            <div className="kicker">Buy coins</div>
            <h3 className="font-display text-base font-bold leading-tight">Top up the treasury</h3>
          </div>
        </div>
        <p className="mb-3 mt-1.5 text-xs text-muted">1 coin = 100 Lek. Coins fund every monthly spread and award.</p>
        <div className="chip-row">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setCoins(p)} className={`chip ${coins === p ? "on" : ""}`}>
              {p.toLocaleString("en-US")}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={coins}
            onChange={(e) => setCoins(parseInt(e.target.value || "0", 10))}
            className="w-28 rounded-[18px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-sm"
          />
          <span className="text-sm text-muted">= <b className="text-ink">{lek.toLocaleString("en-US")}</b> Lek</span>
        </div>
        <button type="button" onClick={buy} disabled={pendingTopUp || !coins || coins <= 0} className="btn btn-primary btn-lg mt-3 w-full disabled:opacity-50">
          {pendingTopUp ? "Processing…" : <span className="inline-flex items-center gap-1.5">Buy {(coins || 0).toLocaleString("en-US")}<CoinIcon className="size-4" /></span>}
        </button>
      </div>

      {/* Distribute the monthly spread */}
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="ico coral shrink-0"><Icon name="gift" size={20} /></span>
          <div>
            <div className="kicker">Monthly spread</div>
            <h3 className="font-display text-base font-bold leading-tight">Pay employees this month</h3>
          </div>
        </div>
        <p className="mb-3 mt-1.5 text-xs text-muted">
          <b className="text-ink">{spread}</b> coins each · <b className="text-ink">{employeeCount}</b> {employeeCount === 1 ? "employee" : "employees"} ={" "}
          <b className="text-ink">{monthlyDraw.toLocaleString("en-US")}</b> coins. Change the amount in Settings.
        </p>
        {distributed ? (
          <div className="flex items-center gap-2 rounded-[18px] bg-lime-soft px-4 py-3 text-sm font-semibold text-lime-deep">
            <Icon name="check" size={18} /> Distributed this month
          </div>
        ) : (
          <button type="button" onClick={distribute} disabled={pendingDist || employeeCount === 0} className="btn btn-lime btn-lg w-full disabled:opacity-50">
            {pendingDist ? "Distributing…" : `Distribute ${monthlyDraw.toLocaleString("en-US")} coins`}
          </button>
        )}
        <p className="mt-2 text-[11px] text-muted">Drawn from the treasury · once per month.</p>
      </div>

      {msg && <p className={`md:col-span-2 text-sm ${msg.ok ? "text-lime-deep" : "text-coral"}`}>{msg.text}</p>}
    </div>
  );
}
