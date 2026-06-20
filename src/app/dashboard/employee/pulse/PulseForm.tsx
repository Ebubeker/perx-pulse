"use client";

import { useEffect, useState, useTransition } from "react";
import { runPulse } from "@/lib/pulse-actions";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

type Mode = "SPEND_ALL" | "SAVE_SOME" | "TREAT_MYSELF" | "TEAM";

const QUESTIONS: { key: string; q: string; options: string[] }[] = [
  { key: "week", q: "How was your week?", options: ["Tired", "Stressed", "Productive", "Social", "Flat"] },
  { key: "need", q: "What do you need most?", options: ["Relax", "Energy", "Health", "Focus", "Fun"] },
  { key: "where", q: "Where?", options: ["Near work", "Near home", "A getaway", "Online"] },
];
// budget modes — the EXACT .mode list from design 12-budget-modes.html
const MODES: { v: Mode; label: string; sub: string; icon: string }[] = [
  { v: "SPEND_ALL", label: "Spend for me", sub: "Pulse uses your full weekly budget", icon: "bot" },
  { v: "SAVE_SOME", label: "Save some", sub: "Keep ~40% as PerxCoin", icon: "piggy" },
  { v: "TREAT_MYSELF", label: "Treat myself", sub: "Go premium, top up if needed", icon: "gift" },
  { v: "TEAM", label: "Team mode", sub: "Bundle with coworkers", icon: "team" },
];
// rotating .step lines from design 10-generating.html
const GEN_STEPS = [
  "Reading your vibe…",
  "Matching local providers…",
  "Checking your budget & tax-free rules…",
  "Wrapping your packs…",
];

export function PulseForm() {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("SPEND_ALL");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const toggle = (k: string, v: string) => setPicks((p) => ({ ...p, [k]: p[k] === v ? "" : v }));

  function submit() {
    setStep(0);
    startTransition(async () => {
      await runPulse(picks, mode);
    });
  }

  // advance the generating-step copy while the server action runs
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 850);
    return () => clearInterval(t);
  }, [pending]);

  const answered = Object.values(picks).filter(Boolean).length;
  const progress = Math.round(((step + 1) / GEN_STEPS.length) * 100);

  // ── Generating state — design 10-generating.html: big charging Mascot + heading + .step + .dots ──
  if (pending) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-8 text-center">
        <div className="float" style={{ display: "flex", justifyContent: "center" }}>
          <Mascot mood="charging" size={200} />
        </div>
        <h1 className="mt-[26px] font-display text-[27px] font-extrabold tracking-[-.02em]">
          Pulse is building<br />your week…
        </h1>
        <div className="step mt-2 h-5 text-sm text-muted">{GEN_STEPS[step]}</div>
        <div className="dots mt-[22px]"><i></i><i></i><i></i></div>
        <div className="bar coral mt-6 w-[200px]"><i style={{ width: `${progress}%`, transition: "width .5s" }} /></div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* greeting + mascot */}
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Weekly Pulse</div>
          <h1>How are you, really?</h1>
        </div>
        <Mascot mood="thinking" size={62} className="float" />
      </div>
      <p className="mt-1 text-sm text-muted">A few taps and Perx builds a perk pack for your week. No typing.</p>

      <div className="mt-6 space-y-6">
        {QUESTIONS.map((qu, i) => (
          <div key={qu.key}>
            <div className="kicker mb-2">{String(i + 1).padStart(2, "0")} · {qu.q}</div>
            <div className="chip-row">
              {qu.options.map((opt) => {
                const on = picks[qu.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(qu.key, opt)}
                    className={`chip ${on ? "on" : ""}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Smart Budget Mode — the EXACT .mode list from 12-budget-modes.html */}
        <div>
          <h2 className="font-display text-[23px] font-bold">Smart Budget Mode</h2>
          <div className="lead mb-[18px] mt-1 text-sm text-muted">Reshapes your 3 packs instantly.</div>
          {MODES.map(({ v, label, sub, icon }) => {
            const on = mode === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`mode ${on ? "on" : ""}`}
              >
                <span className="ic"><Icon name={icon} size={20} /></span>
                <div>
                  <div className="t">{label}</div>
                  <div className="s">{sub}</div>
                </div>
                <span className="rad"></span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="btn btn-primary btn-lg mt-2 disabled:opacity-60"
      >
        {`Build my week${answered ? ` · ${answered}/3` : ""}`}
      </button>
      <p className="mt-2 text-center text-xs text-muted">Takes 20 seconds. Skip any you like.</p>
    </main>
  );
}
