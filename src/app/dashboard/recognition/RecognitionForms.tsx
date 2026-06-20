"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { giveKudos, grantCoins } from "@/lib/coin-actions";

type Colleague = { id: string; displayName: string; role: string };

const AMOUNTS = [5, 10, 20, 50];

export function RecognitionForms({ colleagues, remaining, isAdmin }: { colleagues: Colleague[]; remaining: number; isAdmin: boolean }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(10);
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function sendKudos() {
    setMsg(null);
    startTransition(async () => {
      const res = await giveKudos(to, amount, memo);
      if (res.error) setMsg({ text: res.error });
      else { setMsg({ ok: true, text: "Kudos sent 🎉" }); setMemo(""); router.refresh(); }
    });
  }

  const canGive = remaining > 0;

  return (
    <div className="mt-5 space-y-5">
      <div className="card-dark">
        <div className="blob" />
        <div className="relative z-[2]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[var(--txt-on-dark)]">Send kudos</h2>
            <span className="coin sm">{amount}</span>
          </div>

          <div className="field mt-3 !mb-3">
            <label className="!text-[var(--txt-on-dark-mut)]">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="!border-white/15 !bg-white/10 !text-[var(--txt-on-dark)]"
            >
              <option value="">Pick a colleague…</option>
              {colleagues.map((c) => (
                <option key={c.id} value={c.id} className="text-ink">{c.displayName}</option>
              ))}
            </select>
          </div>

          <div className="field !mb-3">
            <label className="!text-[var(--txt-on-dark-mut)]">Coins</label>
            <div className="chip-row">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  disabled={a > remaining}
                  className={`chip lime disabled:opacity-30 ${amount === a ? "on lime" : "!bg-white/10 !border-white/15 !text-[var(--txt-on-dark)]"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="field !mb-0">
            <label className="!text-[var(--txt-on-dark-mut)]">Why</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Saved the demo at 2am 🙌"
              className="!border-white/15 !bg-white/10 !text-[var(--txt-on-dark)] placeholder:!text-white/40"
            />
          </div>

          <button
            type="button"
            onClick={sendKudos}
            disabled={pending || !to || !canGive}
            className="btn btn-lime btn-lg mt-4 disabled:opacity-50"
          >
            {pending ? "Sending…" : canGive ? `Send ${amount} coins →` : "No coins left this month"}
          </button>
          {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-lime" : "text-coral"}`}>{msg.text}</p>}
        </div>
      </div>

      {isAdmin && <GrantForm colleagues={colleagues} />}
    </div>
  );
}

function GrantForm({ colleagues }: { colleagues: Colleague[] }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(100);
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function grant() {
    setMsg(null);
    startTransition(async () => {
      const res = await grantCoins(to, amount, memo);
      if (res.error) setMsg({ text: res.error });
      else { setMsg({ ok: true, text: "Coins granted ✓" }); setMemo(""); router.refresh(); }
    });
  }

  return (
    <div className="card border-coral/30 bg-coral-soft">
      <div className="flex items-center gap-2">
        <span className="badge badge-new">HR</span>
        <h2 className="font-display text-base font-bold text-coral-deep">Company award</h2>
      </div>
      <p className="mb-3 mt-1 text-xs text-muted">Mint coins straight to an employee — milestones, spot bonuses.</p>
      <div className="flex gap-2">
        <select value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 rounded-[18px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-sm">
          <option value="">Pick a colleague…</option>
          {colleagues.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
          className="w-24 rounded-[18px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-sm"
        />
      </div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="3-year work anniversary 🎉"
        className="mt-2 w-full rounded-[18px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-sm"
      />
      <button type="button" onClick={grant} disabled={pending || !to} className="btn btn-primary btn-lg mt-3 disabled:opacity-50">
        {pending ? "Granting…" : `Grant ${amount || 0} coins`}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-lime-deep" : "text-coral"}`}>{msg.text}</p>}
    </div>
  );
}
