"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { runPulse } from "@/lib/pulse-actions";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

type Mode = "SPEND_ALL" | "SAVE_SOME" | "TREAT_MYSELF" | "TEAM";

const QUESTIONS = [
  { key: "week", q: "How was your week?", hint: "Be honest — Perx tunes to it.", mood: "thinking", options: ["Tired", "Stressed", "Productive", "Social", "Flat"] },
  { key: "need", q: "What do you need most?", hint: "Pick what would help right now.", mood: "cool", options: ["Relax", "Energy", "Health", "Focus", "Fun"] },
  { key: "where", q: "Where do you want it?", hint: "We'll keep it close to you.", mood: "excited", options: ["Near work", "Near home", "A getaway", "Online"] },
] as const;

const MODES: { v: Mode; label: string; sub: string; icon: string }[] = [
  { v: "SPEND_ALL", label: "Spend for me", sub: "Pulse uses your full weekly budget", icon: "bot" },
  { v: "SAVE_SOME", label: "Save some", sub: "Keep ~40% as PerxCoin", icon: "piggy" },
  { v: "TREAT_MYSELF", label: "Treat myself", sub: "Go premium, top up if needed", icon: "gift" },
  { v: "TEAM", label: "Team mode", sub: "Bundle with coworkers", icon: "team" },
];

const GEN_STEPS = ["Reading your vibe…", "Matching local providers…", "Checking your budget & tax-free rules…", "Wrapping your packs…"];

const TOTAL = QUESTIONS.length + 1; // 3 questions + budget mode

const variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -60 : 60, opacity: 0 }),
};

export function PulseForm() {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [locked, setLocked] = useState(false);
  const [pending, startTransition] = useTransition();
  const [genStep, setGenStep] = useState(0);

  const go = (next: number, d: number) => { setDir(d); setStep(next); };
  const advance = () => go(Math.min(step + 1, TOTAL), 1);
  const back = () => { if (step === 0) { router.push("/dashboard/employee"); return; } go(step - 1, -1); };

  function chooseOption(key: string, opt: string) {
    if (locked) return;
    setLocked(true);
    setPicks((p) => ({ ...p, [key]: opt }));
    window.setTimeout(() => { setLocked(false); advance(); }, 200);
  }
  function chooseMode(v: Mode) {
    if (locked) return;
    setLocked(true);
    setMode(v);
    window.setTimeout(() => { setLocked(false); advance(); }, 200);
  }

  function build() {
    setGenStep(0);
    startTransition(async () => { await runPulse(picks, mode ?? "SPEND_ALL"); });
  }

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 850);
    return () => clearInterval(t);
  }, [pending]);

  // ── Generating ──
  if (pending) {
    const progress = Math.round(((genStep + 1) / GEN_STEPS.length) * 100);
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-8 text-center">
        <div className="float" style={{ display: "flex", justifyContent: "center" }}>
          <Mascot mood="charging" size={200} />
        </div>
        <h1 className="mt-[26px] font-display text-[27px] font-extrabold tracking-[-.02em]">Pulse is building<br />your week…</h1>
        <div className="step mt-2 h-5 text-sm text-muted">{GEN_STEPS[genStep]}</div>
        <div className="dots mt-[22px]"><i></i><i></i><i></i></div>
        <div className="bar coral mt-6 w-[200px]"><i style={{ width: `${progress}%`, transition: "width .5s" }} /></div>
      </main>
    );
  }

  const progressPct = Math.round((Math.min(step, TOTAL) / TOTAL) * 100);
  const isQuestion = step < QUESTIONS.length;
  const isBudget = step === QUESTIONS.length;
  const isReview = step === TOTAL;

  return (
    <main className="mx-auto flex min-h-[82vh] max-w-md flex-col px-5 py-5 md:max-w-lg">
      {/* header: back · progress · skip */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={back} aria-label="Back" className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-cream">
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="h-1.5 grow overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-coral" animate={{ width: `${progressPct}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
        </div>
        {isQuestion ? (
          <button type="button" onClick={advance} className="shrink-0 text-sm font-semibold text-muted transition hover:text-ink">Skip</button>
        ) : (
          <span className="w-9 shrink-0" />
        )}
      </div>

      <div className="mt-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted">
        {isReview ? "Ready to build" : `Step ${Math.min(step + 1, TOTAL)} of ${TOTAL}`}
      </div>

      <div className="relative grow">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex min-h-[60vh] flex-col"
          >
            {/* ── question steps ── */}
            {isQuestion && (() => {
              const qu = QUESTIONS[step]!;
              const sel = picks[qu.key];
              return (
                <div className="flex grow flex-col">
                  <div className="mt-6 flex items-center gap-3">
                    <Mascot mood={qu.mood} size={66} className="float shrink-0" />
                    <div>
                      <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-.02em]">{qu.q}</h1>
                      <p className="mt-0.5 text-sm text-muted">{qu.hint}</p>
                    </div>
                  </div>
                  <div className="mt-7 space-y-3">
                    {qu.options.map((opt, idx) => {
                      const on = sel === opt;
                      return (
                        <motion.button
                          key={opt}
                          type="button"
                          onClick={() => chooseOption(qu.key, opt)}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 + idx * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex w-full items-center justify-between rounded-2xl border-[1.5px] px-5 py-4 text-left font-display text-lg font-bold transition ${on ? "border-coral bg-coral text-white shadow-[var(--sh-press)]" : "border-line bg-paper hover:border-coral/50"}`}
                        >
                          {opt}
                          <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-white bg-white/25 text-white" : "border-line"}`}>
                            {on && <Icon name="check" size={13} strokeWidth={3} />}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── budget mode step ── */}
            {isBudget && (
              <div className="flex grow flex-col">
                <div className="mt-6 flex items-center gap-3">
                  <Mascot mood="cool" size={66} className="float shrink-0" />
                  <div>
                    <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-.02em]">Smart Budget Mode</h1>
                    <p className="mt-0.5 text-sm text-muted">How should Perx shape your packs?</p>
                  </div>
                </div>
                <div className="mt-7 space-y-3">
                  {MODES.map(({ v, label, sub, icon }, idx) => {
                    const on = mode === v;
                    return (
                      <motion.button
                        key={v}
                        type="button"
                        onClick={() => chooseMode(v)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 + idx * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition ${on ? "border-coral bg-coral-soft" : "border-line bg-paper hover:border-coral/50"}`}
                      >
                        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? "bg-coral text-white" : "bg-cream text-ink-soft"}`}><Icon name={icon} size={20} /></span>
                        <div className="min-w-0 grow">
                          <div className="font-display text-base font-bold">{label}</div>
                          <div className="text-[13px] text-muted">{sub}</div>
                        </div>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-coral bg-coral text-white" : "border-line"}`}>{on && <Icon name="check" size={13} strokeWidth={3} />}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <button type="button" onClick={advance} className="mt-4 text-center text-sm font-semibold text-muted transition hover:text-ink">Skip — use Spend for me</button>
              </div>
            )}

            {/* ── review / build step ── */}
            {isReview && (
              <div className="flex grow flex-col items-center justify-center text-center">
                <Mascot mood="celebrate" size={150} className="float" />
                <h1 className="mt-5 font-display text-[27px] font-extrabold tracking-[-.02em]">You&apos;re all set!</h1>
                <p className="mt-1.5 max-w-[300px] text-muted">Perx will build 3 perk packs from your answers. Tweak anything, then build.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {QUESTIONS.map((qu, i) => picks[qu.key] ? (
                    <button key={qu.key} type="button" onClick={() => go(i, -1)} className="chip">{picks[qu.key]}</button>
                  ) : null)}
                  <button type="button" onClick={() => go(QUESTIONS.length, -1)} className="chip on">{MODES.find((x) => x.v === (mode ?? "SPEND_ALL"))?.label}</button>
                </div>
                <button type="button" onClick={build} className="btn btn-primary btn-lg mt-7 w-full">Build my week →</button>
                <button type="button" onClick={() => router.push("/dashboard/employee")} className="mt-3 text-sm font-semibold text-muted">Back to dashboard</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
