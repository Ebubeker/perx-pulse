"use client";

import { useRef, useState, useTransition } from "react";
import { spinDaily } from "@/lib/spin-actions";
import { CoinIcon } from "@/components/CoinIcon";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function SpinWheel({ balance, spunToday, streak }: { balance: number; spunToday: boolean; streak: number }) {
  const [bal, setBal] = useState(balance);
  const [done, setDone] = useState(spunToday);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakNow, setStreakNow] = useState(streak);
  const [pending, startTransition] = useTransition();

  const rotorRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);

  function spin() {
    if (done || spinning || pending) return;
    setError(null);
    setSpinning(true);
    startTransition(async () => {
      const res = await spinDaily();
      if (res.error || res.won == null) {
        setError(res.error ?? "Spin failed — try again.");
        setSpinning(false);
        setDone(true);
        return;
      }
      const w = res.won;
      angleRef.current += 360 * 6 + Math.floor(Math.random() * 360);
      if (rotorRef.current) {
        rotorRef.current.style.transition = "transform 3.6s cubic-bezier(.13,.7,.12,1)";
        rotorRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
      window.setTimeout(() => {
        setWon(w);
        setBal(res.balance ?? bal + w);
        if (!spunToday) setStreakNow((s) => s + 1);
        setShowReward(true);
      }, 3700);
    });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-5 py-5">
      <div className="spinview">
        <div className="bal"><CoinIcon className="size-4" /> <span className="v">{bal.toLocaleString("en-US")}</span> PerxCoin</div>
        <h1>Give it a flick</h1>
        <div className="lead">Spin once a day for free PerxCoin. Keep a streak for bigger drops.</div>

        <div className="stagewrap">
          <div className="glow" />
          <div className="ptr" />
          <svg className={`spinner ${done || spinning ? "" : "idle"}`} viewBox="0 0 200 200" width={250} onClick={spin} role="button" aria-label="Spin">
            <g ref={rotorRef} id="rotor">
              <circle cx="100" cy="42" r="35" fill="#EC6A4D" />
              <circle cx="152" cy="132" r="35" fill="#EC6A4D" />
              <circle cx="48" cy="132" r="35" fill="#EC6A4D" />
              <circle cx="100" cy="100" r="46" fill="#EC6A4D" />
              <circle cx="100" cy="42" r="16" fill="#FBF8F0" /><circle cx="100" cy="42" r="8" fill="#C7E63F" />
              <circle cx="152" cy="132" r="16" fill="#FBF8F0" /><circle cx="152" cy="132" r="8" fill="#1B1A16" />
              <circle cx="48" cy="132" r="16" fill="#FBF8F0" /><circle cx="48" cy="132" r="8" fill="#C7E63F" />
              <circle cx="100" cy="100" r="27" fill="#1B1A16" />
              <circle cx="100" cy="100" r="18" fill="#C7E63F" />
              <path d="M103 88l-9 15h6l-2 11 9-15h-6z" fill="#1B1A16" />
            </g>
          </svg>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={done || spinning || pending}
          className={`btn btn-lg spinbtn mt-2 w-[200px] ${done ? "btn-soft" : "btn-dark"} disabled:opacity-60`}
        >
          {done ? "Spun today" : spinning ? "Spinning…" : "Spin for coins"}
        </button>
        <div className="hint mt-3.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {done ? "Next free spin tomorrow" : "Tap the spinner or the button"}
        </div>
        {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}

        <div className="streak">
          {DAYS.map((d, i) => (
            <i key={i} className={i < streakNow ? "on" : ""}>{d}</i>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{streakNow}-day streak · spin 5 days for a <b>+100</b> bonus</p>
      </div>

      {showReward && won != null && (
        <div className="spinreward" onClick={() => setShowReward(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="kicker text-coral">You won</div>
            <div className="big">+{won}<CoinIcon className="size-9" /></div>
            <div className="mb-1 font-bold">PerxCoin added</div>
            <div className="text-[13px] text-muted">Come back tomorrow for another free spin.</div>
            <button type="button" onClick={() => setShowReward(false)} className="btn btn-lime btn-lg mt-[18px]">Collect</button>
          </div>
        </div>
      )}
    </main>
  );
}
