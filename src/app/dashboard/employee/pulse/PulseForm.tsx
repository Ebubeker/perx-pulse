"use client";

import { useState, useTransition } from "react";
import { runPulse } from "@/lib/pulse-actions";

type Mode = "SPEND_ALL" | "SAVE_SOME" | "TREAT_MYSELF" | "TEAM";

const QUESTIONS: { key: string; q: string; options: string[] }[] = [
  { key: "week", q: "How was your week?", options: ["Stressful", "Tiring", "Productive", "Social", "Flat"] },
  { key: "need", q: "What do you need most?", options: ["Relax", "Energy", "Health", "Focus", "Fun"] },
  { key: "where", q: "Where?", options: ["Near work", "Near home", "A getaway", "Online"] },
];
const MODES: [Mode, string][] = [
  ["SPEND_ALL", "Spend for me"],
  ["SAVE_SOME", "Save some"],
  ["TREAT_MYSELF", "Treat myself"],
  ["TEAM", "Team"],
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

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-accent">WEEKLY PULSE</p>
      <h1 className="mt-1 text-2xl font-bold">How are you, really?</h1>
      <p className="mt-1 text-sm text-muted">A few taps and Perx builds a perk pack for your week. No typing.</p>

      <div className="mt-6 space-y-6">
        {QUESTIONS.map((qu, i) => (
          <div key={qu.key}>
            <p className="mb-2 text-sm font-medium">
              <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> {qu.q}
            </p>
            <div className="flex flex-wrap gap-2">
              {qu.options.map((opt) => {
                const on = picks[qu.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(qu.key, opt)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink/40"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-sm font-medium">
            <span className="text-accent">04</span> Budget mode
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${mode === v ? "border-primary bg-primary text-white" : "border-line bg-paper text-ink hover:border-primary"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-7 w-full rounded-xl bg-primary py-4 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Building your week…" : `Build my week${answered ? ` · ${answered}/3` : ""}`}
      </button>
      <p className="mt-2 text-center text-xs text-muted">Takes 20 seconds. Skip any you like.</p>
    </main>
  );
}
