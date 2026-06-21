"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { giveKudos, grantCoins } from "@/lib/coin-actions";
import { Avatar } from "@/components/Avatar";
import { CoinIcon } from "@/components/CoinIcon";
import { Mascot } from "@/components/Mascot";

type Colleague = { id: string; displayName: string; role: string };

const AMOUNTS = [5, 10, 20, 50];

export function RecognitionForms({ colleagues, balance, isAdmin }: { colleagues: Colleague[]; balance: number; isAdmin: boolean }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(10);
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [success, setSuccess] = useState<{ amount: number; toName: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function sendKudos() {
    setMsg(null);
    const sentAmount = amount;
    const sentTo = colleagues.find((c) => c.id === to)?.displayName ?? "your teammate";
    startTransition(async () => {
      const res = await giveKudos(to, amount, memo);
      if (res.error) setMsg({ text: res.error });
      else {
        setSuccess({ amount: sentAmount, toName: sentTo });
        setMemo("");
        setTo("");
        router.refresh();
      }
    });
  }

  const canGive = balance > 0;
  const tooMuch = amount > balance;
  const toName = colleagues.find((c) => c.id === to)?.displayName;

  return (
    <div className="space-y-4">
      {/* Big mascot presence for sending kudos */}
      <div className="flex items-center gap-3.5">
        <Mascot mood="love" size={92} className="float shrink-0" />
        <div className="min-w-0">
          <div className="kicker">Send kudos</div>
          <h3 className="font-display text-xl font-extrabold leading-tight">Recognize a teammate</h3>
          <p className="mt-0.5 text-[13px] text-muted">Straight from your wallet · <b className="text-ink">{balance}</b> coins to give</p>
        </div>
      </div>

      {/* Recipient picker — HORIZONTAL scroll strip of illustrated coworker avatars (.kudos > .k) */}
      {colleagues.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper px-4 py-5 text-center text-sm text-muted">
          No coworkers to recognize yet.
        </p>
      ) : (
        <div className="kudos">
          {colleagues.map((c) => {
            const on = c.id === to;
            return (
              <button key={c.id} type="button" onClick={() => setTo(c.id)} className={`k rounded-2xl py-2 transition ${on ? "bg-coral-soft" : "hover:bg-black/[.04]"}`}>
                <span className="mx-auto mb-1.5 block w-fit">
                  <Avatar name={c.displayName} seed={c.id} size={54} />
                </span>
                <span className={`block truncate px-1 text-xs font-semibold ${on ? "text-coral-deep" : "text-muted"}`}>
                  {c.displayName.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dark send box (.sendbox) */}
      <div className="sendbox">
        <div className="flex items-center justify-between">
          <div className="font-bold">
            Kudos to <b className="text-lime">{toName ?? "…"}</b>
          </div>
          <span className="coin sm"><CoinIcon /> {amount}</span>
        </div>

        <div className="chip-row mt-3">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              disabled={a > balance}
              className={`chip lime disabled:opacity-30 ${amount === a ? "on lime" : "!border-white/15 !bg-white/10 !text-[var(--txt-on-dark)]"}`}
            >
              {a}
            </button>
          ))}
        </div>

        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Say why — “thanks for covering my shift!”"
        />

        <button
          type="button"
          onClick={sendKudos}
          disabled={pending || !to || !canGive || tooMuch}
          className="btn btn-lime btn-lg mt-3 w-full disabled:opacity-50"
        >
          {pending ? "Sending…" : !to ? "Pick someone above" : !canGive ? "Your wallet is empty" : tooMuch ? "Not enough coins" : "Send kudos →"}
        </button>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-lime" : "text-coral"}`}>{msg.text}</p>}
      </div>

      {isAdmin && <GrantForm colleagues={colleagues} />}

      {/* Success celebration overlay — character celebrating + "Sent successfully" */}
      {success && (
        <div className="spinreward" onClick={() => setSuccess(null)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <Mascot mood="celebrate" size={118} className="float mx-auto" />
            <div className="kicker mt-1 text-coral">Kudos delivered</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">Sent successfully!</h2>
            <div className="big">+{success.amount}<CoinIcon className="size-9" /></div>
            <div className="text-[13px] text-muted">to <b className="text-ink">{success.toName}</b> · straight from your wallet</div>
            <button type="button" onClick={() => setSuccess(null)} className="btn btn-lime btn-lg mt-[18px]">Done</button>
          </div>
        </div>
      )}
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
        placeholder="3-year work anniversary"
        className="mt-2 w-full rounded-[18px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-sm"
      />
      <button type="button" onClick={grant} disabled={pending || !to} className="btn btn-primary btn-lg mt-3 disabled:opacity-50">
        {pending ? "Granting…" : `Grant ${amount || 0} coins`}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-lime-deep" : "text-coral"}`}>{msg.text}</p>}
    </div>
  );
}
