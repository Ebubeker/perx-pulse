"use client";

import { useState, useTransition, useId, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { completeEmployeeOnboarding } from "@/lib/onboarding-actions";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

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

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0 || pending}
          onClick={() => setStep(step - 1)}
          className="btn-icon disabled:opacity-40"
          aria-label="Back"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.12em] text-coral">
        <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <span>{pct}%</span>
      </div>
      <div className="bar mt-2.5">
        <i style={{ width: `${pct}%` }} />
      </div>

      {step === 0 ? (
        <div className="mt-4 flex flex-col items-center text-center">
          <p className="kicker">Welcome to {companyName}</p>
          <h1 className="mt-2 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight">
            Welcome, <em className="not-italic text-coral">{displayName.trim() || "there"}</em>
          </h1>
          <div className="speech relative mt-5 max-w-[300px] rounded-[18px] border border-line bg-paper px-4 py-3 text-sm font-semibold shadow-soft after:absolute after:-bottom-2 after:left-1/2 after:size-3.5 after:-translate-x-1/2 after:rotate-45 after:border-b after:border-r after:border-line after:bg-paper after:content-['']">
            Hi 👋 Tell me your vibe — I&apos;ll do the rest.
          </div>
          <Mascot mood="antenna" size={180} className="float -mt-2" />
        </div>
      ) : (
        <h1 className="mt-[18px] font-display text-[30px] font-extrabold tracking-tight">
          {step === 1 ? "What you're into" : "Wellness & diet"}
        </h1>
      )}

      <div className="mt-6 flex-1 space-y-5">
        {step === 0 && (
          <>
            <Field label="Your name *">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Job title">
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
            </Field>
            <Field label="Where do you work?" hint="Office area">
              <input value={workArea} onChange={(e) => setWorkArea(e.target.value)} placeholder="Blloku" />
            </Field>
            <Field label="Where do you live?" hint="For perks near home">
              <input value={homeArea} onChange={(e) => setHomeArea(e.target.value)} placeholder="Yzberisht" />
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

      {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}

      <div className="sticky bottom-0 -mx-5 mt-6 bg-cream px-5 pb-2 pt-4">
        {step < last ? (
          <button type="button" disabled={!stepValid} onClick={() => setStep(step + 1)} className="btn btn-dark btn-lg disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button type="button" disabled={!stepValid || pending} onClick={submit} className="btn btn-primary btn-lg disabled:opacity-50">
            {pending ? "Finishing…" : "Take your first Pulse →"}
          </button>
        )}
      </div>
    </main>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chip-row">
        {options.map(([v, l]) => (
          <button
            type="button"
            key={v}
            onClick={() => toggle(v)}
            className={`chip${value.includes(v) ? " on" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}
      {hint && <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{hint}</span>}
    </div>
  );
}
