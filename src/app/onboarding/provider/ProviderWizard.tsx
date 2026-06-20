"use client";

import { useState, useTransition, type ReactNode } from "react";
import { setupProvider } from "@/lib/onboarding-actions";

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
const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary";

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

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-10">
      <p className="text-sm text-muted">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-line">
        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <h1 className="mt-5 text-2xl font-bold">List your business</h1>

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <>
            <Field label="Business name *">
              <input className={inputCls} value={f.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Nobis Wellness" />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea className={inputCls} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What you offer…" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Address">
              <input className={inputCls} value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </Field>
            <Field label="City">
              <input className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Areas served" hint="Comma-separated">
              <input className={inputCls} value={f.areasServed} onChange={(e) => set("areasServed", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Contact name">
              <input className={inputCls} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Contact email">
              <input className={inputCls} type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Contact phone">
              <input className={inputCls} value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label="NIPT / NUIS (business ID)">
              <input className={inputCls} value={f.nipt} onChange={(e) => set("nipt", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.vatRegistered} onChange={(e) => set("vatRegistered", e.target.checked)} /> VAT registered
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="How would you like to be paid?">
              <select className={inputCls} value={f.settlementMethod} onChange={(e) => set("settlementMethod", e.target.value)}>
                <option value="BANK">Bank transfer (IBAN)</option>
                <option value="PERXCOIN">PerxCoin (instant settlement)</option>
              </select>
            </Field>
            {f.settlementMethod === "BANK" && (
              <Field label="Bank IBAN">
                <input className={inputCls} value={f.bankIban} onChange={(e) => set("bankIban", e.target.value)} placeholder="AL…" />
              </Field>
            )}
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
            {pending ? "Listing…" : "Finish setup"}
          </button>
        )}
      </div>
    </main>
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
