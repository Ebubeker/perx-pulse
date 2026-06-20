"use client";

import { useState, useTransition, type ReactNode } from "react";
import { setupCompany } from "@/lib/onboarding-actions";

const INDUSTRIES = ["Technology", "Finance", "Retail", "Manufacturing", "Healthcare", "Hospitality", "Education", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
const STEPS = ["Company", "Legal & location", "Benefits", "You"];
const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary";

export function CompanyWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    brandName: "",
    industry: "Technology",
    sizeBucket: "11–50",
    website: "",
    nipt: "",
    vatRegistered: false,
    addressLine: "",
    city: "Tiranë",
    defaultBudgetLek: "12000",
    departments: "Engineering, Sales, Operations",
    billingContactName: "",
    billingContactEmail: "",
    adminName: "",
    adminTitle: "",
    adminRole: "ADMIN",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const last = STEPS.length - 1;
  const stepValid = step === 0 ? f.name.trim().length >= 2 : step === last ? f.adminName.trim().length >= 1 : true;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await setupCompany({
        ...f,
        departments: f.departments.split(",").map((s) => s.trim()).filter(Boolean),
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
      <h1 className="mt-5 text-2xl font-bold">Set up your company</h1>

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <>
            <Field label="Company legal name *">
              <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Kodra Studio sh.p.k." />
            </Field>
            <Field label="Brand / display name">
              <input className={inputCls} value={f.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Kodra Studio" />
            </Field>
            <Field label="Industry">
              <select className={inputCls} value={f.industry} onChange={(e) => set("industry", e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="Company size">
              <select className={inputCls} value={f.sizeBucket} onChange={(e) => set("sizeBucket", e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Website">
              <input className={inputCls} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="NIPT / NUIS (business ID)">
              <input className={inputCls} value={f.nipt} onChange={(e) => set("nipt", e.target.value)} placeholder="L12345678A" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.vatRegistered} onChange={(e) => set("vatRegistered", e.target.checked)} /> VAT registered
            </label>
            <Field label="Address">
              <input className={inputCls} value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Rr. ..." />
            </Field>
            <Field label="City">
              <input className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Monthly perks budget per employee (Lek)">
              <input className={inputCls} type="number" value={f.defaultBudgetLek} onChange={(e) => set("defaultBudgetLek", e.target.value)} />
            </Field>
            <Field label="Departments" hint="Comma-separated">
              <input className={inputCls} value={f.departments} onChange={(e) => set("departments", e.target.value)} />
            </Field>
            <Field label="Billing contact name">
              <input className={inputCls} value={f.billingContactName} onChange={(e) => set("billingContactName", e.target.value)} />
            </Field>
            <Field label="Billing contact email">
              <input className={inputCls} type="email" value={f.billingContactEmail} onChange={(e) => set("billingContactEmail", e.target.value)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Your name *">
              <input className={inputCls} value={f.adminName} onChange={(e) => set("adminName", e.target.value)} />
            </Field>
            <Field label="Your job title">
              <input className={inputCls} value={f.adminTitle} onChange={(e) => set("adminTitle", e.target.value)} placeholder="People Lead" />
            </Field>
            <Field label="Your role">
              <select className={inputCls} value={f.adminRole} onChange={(e) => set("adminRole", e.target.value)}>
                <option value="ADMIN">Owner / Admin</option>
                <option value="HR">HR</option>
                <option value="FINANCE">Finance</option>
              </select>
            </Field>
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
            {pending ? "Setting up…" : "Finish setup"}
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
