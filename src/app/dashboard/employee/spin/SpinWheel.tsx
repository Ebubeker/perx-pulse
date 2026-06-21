"use client";

import { useRef, useState, useTransition } from "react";
import { spinDaily, resetSpinToday } from "@/lib/spin-actions";
import { SPIN_SEGMENTS, STREAK_GOAL, STREAK_BONUS } from "@/lib/spin-config";
import { CoinIcon } from "@/components/CoinIcon";
import { Mascot } from "@/components/Mascot";

const SEG = 360 / SPIN_SEGMENTS.length; // degrees between rim points

// Each rim point shows a possible coin amount. The label is pre-rotated by its own
// angle so that when the wheel lands that point at the top, the amount is upright.
const RIM = SPIN_SEGMENTS.map((value, i) => {
  const angle = i * SEG;
  const a = (angle * Math.PI) / 180;
  return { x: 100 + 77 * Math.sin(a), y: 100 - 77 * Math.cos(a), value, angle };
});

export function SpinWheel({ balance, spunToday, streak, dev = false }: { balance: number; spunToday: boolean; streak: number; dev?: boolean }) {
  const [bal, setBal] = useState(balance);
  const [done, setDone] = useState(spunToday);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [bonusWon, setBonusWon] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakNow, setStreakNow] = useState(streak);
  const [pending, startTransition] = useTransition();

  const rotorRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);

  // Weekly ring progress: fills 1..GOAL, showing a full ring on the completion day.
  const ringFill = streakNow === 0 ? 0 : streakNow % STREAK_GOAL === 0 ? STREAK_GOAL : streakNow % STREAK_GOAL;
  const toBonus = (STREAK_GOAL - ringFill) % STREAK_GOAL;

  function spin() {
    if (done || spinning || pending) return;
    setError(null);
    setSpinning(true);
    startTransition(async () => {
      const res = await spinDaily();
      if (res.error || res.won == null) {
        setError(res.error ?? "Spin failed. Try again.");
        setSpinning(false);
        setDone(true);
        return;
      }
      const w = res.won;
      const bonus = res.bonus ?? 0;
      const streakAfter = res.streak ?? streakNow + 1;

      // Land the winning amount (server-chosen index) at the top pointer.
      const idx = res.index ?? Math.floor(Math.random() * SPIN_SEGMENTS.length);
      const target = (360 - idx * SEG) % 360;
      const cur = angleRef.current;
      const curMod = ((cur % 360) + 360) % 360;
      angleRef.current = cur + ((target - curMod + 360) % 360) + 360 * 6;
      if (rotorRef.current) {
        rotorRef.current.style.transition = "transform 3.6s cubic-bezier(.13,.7,.12,1)";
        rotorRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
      window.setTimeout(() => {
        setCelebrate(true); // swap the mascot to its excited self the moment it stops
        setWon(w);
        setBonusWon(bonus);
        setBal(res.balance ?? bal + w + bonus);
        setStreakNow(streakAfter);
        setShowReward(true);
      }, 3700);
    });
  }

  function resetForTesting() {
    if (spinning || pending) return;
    startTransition(async () => {
      const res = await resetSpinToday();
      if (res.error) { setError(res.error); return; }
      setDone(false);
      setSpinning(false);
      setShowReward(false);
      setCelebrate(false);
      setWon(null);
      setError(null);
      if (res.balance != null) setBal(res.balance);
      if (res.streak != null) setStreakNow(res.streak);
    });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-5 py-5">
      <div className="spinview">
        <div className="bal"><CoinIcon className="size-4" /> <span className="v">{bal.toLocaleString("en-US")}</span> PerxCoin</div>
        <h1>Give it a flick</h1>
        <div className="lead">Spin once a day for a little free PerxCoin. Come back daily to build your streak.</div>

        <div className="stagewrap">
          <div className="glow" />
          <div className="ptr" />
          {/* spinning coral wheel (decorative) — a ring with evenly spaced rim lights */}
          <svg className={`spinner ${done || spinning ? "" : "idle"}`} viewBox="0 0 200 200" width={250} onClick={spin} role="button" aria-label="Spin">
            <g ref={rotorRef} id="rotor">
              <circle cx="100" cy="100" r="96" fill="#EC6A4D" />
              <circle cx="100" cy="100" r="58" fill="#FBF8F0" />
              {RIM.map((d, i) => (
                <g key={i} transform={`rotate(${d.angle} ${d.x} ${d.y})`}>
                  <circle cx={d.x} cy={d.y} r="14" fill={d.value === 10 ? "#C7E63F" : "#FBF8F0"} stroke="#1B1A16" strokeWidth="1.5" />
                  <text x={d.x} y={d.y} fill="#1B1A16" fontSize="13" fontWeight="800" textAnchor="middle" dominantBaseline="central">{d.value}</text>
                </g>
              ))}
            </g>
          </svg>
          {/* the character sits in the middle, upright; it cheers when the spin ends */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <Mascot
              mood={celebrate ? "celebrate" : "holding"}
              size={104}
              className={`transition-transform duration-300 ${celebrate ? "scale-110" : spinning ? "" : "float"}`}
            />
          </div>
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
        {dev && (
          <button type="button" onClick={resetForTesting} disabled={spinning || pending} className="mt-2 text-[11px] underline text-muted disabled:opacity-50">
            Reset today (dev)
          </button>
        )}

        <div className="streak">
          {Array.from({ length: STREAK_GOAL }, (_, i) => (
            <i key={i} className={i < ringFill ? "on" : ""}>{i + 1}</i>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {streakNow === 0
            ? "Spin daily to start a streak"
            : toBonus === 0
              ? <><b>{STREAK_GOAL}-day streak!</b> +{STREAK_BONUS} bonus earned</>
              : <>{streakNow}-day streak · {toBonus} more {toBonus === 1 ? "day" : "days"} for a <b>+{STREAK_BONUS}</b> bonus</>}
        </p>
      </div>

      {showReward && won != null && (
        <div className="spinreward" onClick={() => setShowReward(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="kicker text-coral">You won</div>
            <div className="big">+{won}<CoinIcon className="size-9" /></div>
            <div className="mb-1 font-bold">PerxCoin added</div>
            {bonusWon > 0 ? (
              <div className="text-[13px] text-muted">Plus a <b>+{bonusWon}</b> bonus for a {STREAK_GOAL}-day streak!</div>
            ) : (
              <div className="text-[13px] text-muted">Come back tomorrow for another free spin.</div>
            )}
            <button type="button" onClick={() => setShowReward(false)} className="btn btn-lime btn-lg mt-[18px]">Collect</button>
          </div>
        </div>
      )}
    </main>
  );
}
