"use client";

import { useState, useTransition, useId, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { setupProvider } from "@/lib/onboarding-actions";
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
const STEPS = ["Business", "Location", "Contact & legal", "Settlement"];

export function ProviderWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    businessName: "",
    category: "wellness",
    description: "",
    addressLine: "",
    city: "Tiranë",
    areasServed: "Blloku, Qendër",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    nipt: "",
    vatRegistered: false,
    settlementMethod: "BANK",
    bankIban: "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const last = STEPS.length - 1;
  const stepValid = step === 0 ? f.businessName.trim().length >= 2 : true;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await setupProvider({
        ...f,
        areasServed: f.areasServed.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (res?.error) setError(res.error);
    });
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={step === 0 || pending} onClick={() => setStep(step - 1)} className="btn-icon disabled:opacity-40" aria-label="Back"><Icon name="chevronLeft" size={20} /></button>
        <Mascot mood="cool" size={48} className="float" />
      </div>

      <div className="mt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-coral">
        <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <span>{pct}%</span>
      </div>
      <div className="bar coral mt-2.5">
        <i style={{ width: `${pct}%` }} />
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">List your business</h1>
      <p className="mt-1.5 text-muted">Employees will discover you in their weekly packs.</p>

      <div className="mt-6">
        {step === 0 && (
          <>
            <Field label="Business name *">
              <input value={f.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Nobis Wellness" />
            </Field>
            <div className="field">
              <label>Category</label>
              <div className="chip-row">
                {CATEGORIES.map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => set("category", v)}
                    className={`chip${f.category === v ? " on" : ""}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Description">
              <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What you offer…" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Address">
              <input value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </Field>
            <Field label="City">
              <input value={f.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Areas served" hint="Comma-separated">
              <input value={f.areasServed} onChange={(e) => set("areasServed", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Contact name">
              <input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Contact email">
              <input type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Contact phone">
              <input value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label="NIPT / NUIS (business ID)">
              <input value={f.nipt} onChange={(e) => set("nipt", e.target.value)} />
            </Field>
            <label className="mb-4 flex items-center gap-2.5 text-sm font-medium text-ink-soft">
              <input type="checkbox" checked={f.vatRegistered} onChange={(e) => set("vatRegistered", e.target.checked)} className="size-4 accent-coral" /> VAT registered
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="How would you like to be paid?">
              <select value={f.settlementMethod} onChange={(e) => set("settlementMethod", e.target.value)}>
                <option value="BANK">Bank transfer (IBAN)</option>
                <option value="PERXCOIN">PerxCoin (instant settlement)</option>
              </select>
            </Field>
            {f.settlementMethod === "BANK" && (
              <Field label="Bank IBAN">
                <input value={f.bankIban} onChange={(e) => set("bankIban", e.target.value)} placeholder="AL…" />
              </Field>
            )}
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}

      <div className="mt-auto pt-8">
        {step < last ? (
          <button type="button" disabled={!stepValid} onClick={() => setStep(step + 1)} className="btn btn-dark btn-lg disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button type="button" disabled={!stepValid || pending} onClick={submit} className="btn btn-primary btn-lg disabled:opacity-50">
            {pending ? "Listing…" : "Finish setup"}
          </button>
        )}
      </div>
    </main>
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
