"use client";

import { useState, useTransition } from "react";
import { runPulse } from "@/lib/pulse-actions";
import { Mascot } from "@/components/Mascot";

type Mode = "SPEND_ALL" | "SAVE_SOME" | "TREAT_MYSELF" | "TEAM";

const QUESTIONS: { key: string; q: string; options: string[] }[] = [
  { key: "week", q: "How was your week?", options: ["Stressful", "Tiring", "Productive", "Social", "Flat"] },
  { key: "need", q: "What do you need most?", options: ["Relax", "Energy", "Health", "Focus", "Fun"] },
  { key: "where", q: "Where?", options: ["Near work", "Near home", "A getaway", "Online"] },
];
const MODES: { v: Mode; label: string; sub: string; icon: string }[] = [
  { v: "SPEND_ALL", label: "Spend for me", sub: "Pulse uses your full weekly budget", icon: "🤖" },
  { v: "SAVE_SOME", label: "Save some", sub: "Keep ~40% as PerxCoin", icon: "🐖" },
  { v: "TREAT_MYSELF", label: "Treat myself", sub: "Go premium, top up if needed", icon: "🎁" },
  { v: "TEAM", label: "Team mode", sub: "Bundle with coworkers", icon: "👥" },
];

export function PulseForm() {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>("SPEND_ALL");
  const [pending, startTransition] = useTransition();

  const toggle = (k: string, v: string) => setPicks((p) => ({ ...p, [k]: p[k] === v ? "" : v }));

  function submit() {
    startTransition(async () => {
      await runPulse(picks, mode);
    });
  }

  const answered = Object.values(picks).filter(Boolean).length;

  // "Pulse is building your week" — the generating state (design 10-generating.html)
  if (pending) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Mascot mood="charging" size={180} className="float" />
        <h1 className="mt-6 font-display text-2xl font-bold leading-tight">Pulse is building<br />your week…</h1>
        <p className="mt-2 text-sm text-muted">Matching local providers, checking your budget &amp; tax-free rules.</p>
        <div className="mt-6 flex gap-2">
          <i className="size-2.5 rounded-full bg-coral pulse-dot" />
          <i className="size-2.5 rounded-full bg-lime-deep pulse-dot" style={{ animationDelay: ".15s" }} />
          <i className="size-2.5 rounded-full bg-coral pulse-dot" style={{ animationDelay: ".3s" }} />
        </div>
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

        <div>
          <div className="kicker mb-2">04 · Smart budget mode</div>
          <div className="space-y-2.5">
            {MODES.map(({ v, label, sub, icon }) => {
              const on = mode === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMode(v)}
                  className={`flex w-full items-center gap-3.5 rounded-[18px] border p-4 text-left transition ${on ? "border-coral bg-paper shadow-soft" : "border-line bg-cream"}`}
                >
                  <span className={`grid size-[42px] shrink-0 place-items-center rounded-xl text-xl ${on ? "bg-coral text-white" : "bg-coral-soft"}`}>{icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">{label}</span>
                    <span className="block text-[12.5px] text-muted">{sub}</span>
                  </span>
                  <span className={`size-[22px] shrink-0 rounded-full border-2 ${on ? "border-coral bg-[radial-gradient(var(--coral)_40%,#fff_45%)]" : "border-line"}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="btn btn-primary btn-lg mt-7 disabled:opacity-60"
      >
        {`Build my week${answered ? ` · ${answered}/3` : ""}`}
      </button>
      <p className="mt-2 text-center text-xs text-muted">Takes 20 seconds. Skip any you like.</p>
    </main>
  );
}
