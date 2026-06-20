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
      <div className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-semibold">Send kudos</h2>
        <label className="mb-1 block text-xs font-medium text-muted">To</label>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm"
        >
          <option value="">Pick a colleague…</option>
          {colleagues.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>

        <label className="mb-1 mt-3 block text-xs font-medium text-muted">Coins</label>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              disabled={a > remaining}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition disabled:opacity-30 ${amount === a ? "border-gold-ink bg-gold-ink text-white" : "border-line bg-paper"}`}
            >
              {a}
            </button>
          ))}
        </div>

        <label className="mb-1 mt-3 block text-xs font-medium text-muted">Why</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Saved the demo at 2am 🙌"
          className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm"
        />

        <button
          type="button"
          onClick={sendKudos}
          disabled={pending || !to || !canGive}
          className="mt-4 w-full rounded-xl bg-gold-ink py-3 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : canGive ? `Send ${amount} coins` : "No coins left this month"}
        </button>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-primary" : "text-accent"}`}>{msg.text}</p>}
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
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h2 className="mb-1 font-semibold text-accent">Company award (HR)</h2>
      <p className="mb-3 text-xs text-muted">Mint coins straight to an employee — milestones, spot bonuses.</p>
      <div className="flex gap-2">
        <select value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm">
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
          className="w-24 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm"
        />
      </div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="3-year work anniversary 🎉"
        className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm"
      />
      <button type="button" onClick={grant} disabled={pending || !to} className="mt-3 w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50">
        {pending ? "Granting…" : `Grant ${amount || 0} coins`}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-primary" : "text-accent"}`}>{msg.text}</p>}
    </div>
  );
}
