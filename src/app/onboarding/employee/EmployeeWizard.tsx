"use client";

import { useState, useTransition, type ReactNode } from "react";
import { completeEmployeeOnboarding } from "@/lib/onboarding-actions";

const CATEGORIES: [string, string][] = [
  ["wellness", "Wellness"],
  ["fitness", "Fitness"],
  ["food", "Food"],
  ["health", "Health"],
  ["travel", "Travel"],
  ["learning", "Learning"],
  ["culture", "Culture"],
  ["telecom", "Telecom"],
];
const INTERESTS = ["Coffee", "Gym", "Yoga", "Running", "Hiking", "Books", "Cinema", "Gaming", "Cooking", "Football", "Music", "Travel"];
const GOALS = ["Reduce stress", "More energy", "Get fit", "Better sleep", "Eat healthy", "Recover"];
const DIETARY = ["Vegetarian", "Vegan", "Gluten-free", "Halal", "No restrictions"];
const LANGS = ["Albanian", "English", "Italian", "German"];
const STEPS = ["You", "What you like", "Wellness & diet"];
const inputCls = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary";

export function EmployeeWizard({ companyName }: { companyName: string }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [workArea, setWorkArea] = useState("");
  const [homeArea, setHomeArea] = useState("");
  const [preferredCategories, setCats] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [wellnessGoals, setGoals] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [languages, setLangs] = useState<string[]>(["Albanian"]);

  const last = STEPS.length - 1;
  const stepValid = step === 0 ? displayName.trim().length >= 1 : true;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeEmployeeOnboarding({
        displayName,
        jobTitle,
        workArea,
        homeArea,
        preferredCategories,
        interests,
        wellnessGoals,
        dietary,
        languages,
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-10">
      <p className="text-sm text-muted">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-line">
        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <h1 className="mt-5 text-2xl font-bold">Welcome to {companyName}</h1>
      <p className="mt-1 text-sm text-muted">A few taps so Perx can build perks you&apos;ll actually use.</p>

      <div className="mt-5 space-y-5">
        {step === 0 && (
          <>
            <Field label="Your name *">
              <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Job title">
              <input className={inputCls} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
            </Field>
            <Field label="Where do you work?" hint="Office area">
              <input className={inputCls} value={workArea} onChange={(e) => setWorkArea(e.target.value)} placeholder="Blloku" />
            </Field>
            <Field label="Where do you live?" hint="For perks near home">
              <input className={inputCls} value={homeArea} onChange={(e) => setHomeArea(e.target.value)} placeholder="Yzberisht" />
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Chips label="Perks you're into" options={CATEGORIES} value={preferredCategories} onChange={setCats} />
            <Chips label="Interests" options={INTERESTS.map((i) => [i, i])} value={interests} onChange={setInterests} />
          </>
        )}
        {step === 2 && (
          <>
            <Chips label="Wellness goals" options={GOALS.map((i) => [i, i])} value={wellnessGoals} onChange={setGoals} />
            <Chips label="Dietary" options={DIETARY.map((i) => [i, i])} value={dietary} onChange={setDietary} />
            <Chips label="Languages" options={LANGS.map((i) => [i, i])} value={languages} onChange={setLangs} />
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button type="button" disabled={step === 0 || pending} onClick={() => setStep(step - 1)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted disabled:opacity-40">
          Back
        </button>
        {step < last ? (
          <button type="button" disabled={!stepValid} onClick={() => setStep(step + 1)} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button type="button" disabled={!stepValid || pending} onClick={submit} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">
            {pending ? "Finishing…" : "Finish"}
          </button>
        )}
      </div>
    </main>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button
            type="button"
            key={v}
            onClick={() => toggle(v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${value.includes(v) ? "border-primary bg-primary text-white" : "border-line bg-paper text-ink hover:border-primary"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
