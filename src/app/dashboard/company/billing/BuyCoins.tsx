"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { topUpTreasury } from "@/lib/treasury-actions";
import { coinFaceLek, coinCommissionUsd, coinCommissionLek, coinTotalCostLek } from "@/lib/pricing";
import { CoinIcon } from "@/components/CoinIcon";

const PRESETS = [1000, 5000, 25000];
const inputCls = "w-full rounded-[16px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

export function BuyCoins({ balance }: { balance: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [coins, setCoins] = useState(5000);
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);

  const n = Math.max(0, Math.floor(coins || 0));
  const face = coinFaceLek(n);
  const commLek = coinCommissionLek(n);
  const commUsd = coinCommissionUsd(n);
  const total = coinTotalCostLek(n);

  function pick(v: number) {
    setMsg(null);
    setCoins(v);
    setCustom("");
  }

  function buy() {
    if (!(n > 0)) { setMsg({ error: "Choose how many coins to buy." }); return; }
    setMsg(null);
    startTransition(async () => {
      const res = await topUpTreasury(n);
      if (res.error) { setMsg({ error: res.error }); return; }
      setMsg({ ok: `${n.toLocaleString("en-US")} coins added to your treasury.` });
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="kicker">Coin treasury</div>
        <span className="inline-flex items-center gap-1.5 font-display text-2xl font-bold text-lime-deep">
          <CoinIcon className="size-6" />{balance.toLocaleString("en-US")}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Every allowance, award and recognition coin is drawn from this pool — so the coin supply is always backed by real money. Top it up to keep your team funded.
      </p>

      {/* presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => pick(v)}
            className={`chip ${coins === v && !custom ? "on" : ""}`}
          >
            +{v.toLocaleString("en-US")}
          </button>
        ))}
        <input
          className={`${inputCls} !w-32 !py-2`}
          type="number"
          min={0}
          placeholder="Custom"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setCoins(Number(e.target.value || 0)); setMsg(null); }}
        />
      </div>

      {/* cost breakdown */}
      <div className="mt-4 space-y-2 rounded-[16px] bg-cream p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Coins to treasury</span>
          <span className="inline-flex items-center gap-1 font-semibold"><CoinIcon className="size-4" />{n.toLocaleString("en-US")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Face value</span>
          <span className="font-semibold">{face.toLocaleString("en-US")} L</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Perx commission <span className="text-xs">($1 / 100 coins)</span></span>
          <span className="font-semibold text-coral">+ {commLek.toLocaleString("en-US")} L <span className="text-xs">(${commUsd})</span></span>
        </div>
        <div className="my-1 h-px bg-line" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total you pay</span>
          <span className="font-display text-lg font-bold">{total.toLocaleString("en-US")} L</span>
        </div>
      </div>

      <button onClick={buy} disabled={pending} className="btn btn-primary mt-4 w-full disabled:opacity-60">
        {pending ? "Processing…" : `Buy ${n.toLocaleString("en-US")} coins`}
      </button>
      {msg?.ok && <p className="mt-2 text-sm font-medium text-lime-deep">{msg.ok}</p>}
      {msg?.error && <p className="mt-2 text-sm font-medium text-coral">{msg.error}</p>}
    </div>
  );
}
