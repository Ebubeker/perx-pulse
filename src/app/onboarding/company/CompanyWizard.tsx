"use client";

import { useState, useTransition, useId, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { setupCompany } from "@/lib/onboarding-actions";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

const INDUSTRIES = ["Technology", "Finance", "Retail", "Manufacturing", "Healthcare", "Hospitality", "Education", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
const STEPS = ["Company", "Legal & location", "Benefits", "You"];

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

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={step === 0 || pending} onClick={() => setStep(step - 1)} className="btn-icon disabled:opacity-40" aria-label="Back"><Icon name="chevronLeft" size={20} /></button>
        <Mascot mood="charged" size={48} className="float" />
      </div>

      <div className="mt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-coral">
        <span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>
        <span>{pct}%</span>
      </div>
      <div className="bar mt-2.5">
        <i style={{ width: `${pct}%` }} />
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Set up your company</h1>

      <div className="mt-6">
        {step === 0 && (
          <>
            <Field label="Company legal name *">
              <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Kodra Studio sh.p.k." />
            </Field>
            <Field label="Brand / display name">
              <input value={f.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Kodra Studio" />
            </Field>
            <Field label="Industry">
              <select value={f.industry} onChange={(e) => set("industry", e.target.value)}>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="Company size">
              <select value={f.sizeBucket} onChange={(e) => set("sizeBucket", e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Website">
              <input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="NIPT / NUIS (business ID)">
              <input value={f.nipt} onChange={(e) => set("nipt", e.target.value)} placeholder="L12345678A" />
            </Field>
            <label className="mb-4 flex items-center gap-2.5 text-sm font-medium text-ink-soft">
              <input type="checkbox" checked={f.vatRegistered} onChange={(e) => set("vatRegistered", e.target.checked)} className="size-4 accent-coral" /> VAT registered
            </label>
            <Field label="Address">
              <input value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} placeholder="Rr. ..." />
            </Field>
            <Field label="City">
              <input value={f.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Monthly perks budget per employee (Lek)">
              <input type="number" value={f.defaultBudgetLek} onChange={(e) => set("defaultBudgetLek", e.target.value)} />
            </Field>
            <Field label="Departments" hint="Comma-separated">
              <input value={f.departments} onChange={(e) => set("departments", e.target.value)} />
            </Field>
            <Field label="Billing contact name">
              <input value={f.billingContactName} onChange={(e) => set("billingContactName", e.target.value)} />
            </Field>
            <Field label="Billing contact email">
              <input type="email" value={f.billingContactEmail} onChange={(e) => set("billingContactEmail", e.target.value)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Your name *">
              <input value={f.adminName} onChange={(e) => set("adminName", e.target.value)} />
            </Field>
            <Field label="Your job title">
              <input value={f.adminTitle} onChange={(e) => set("adminTitle", e.target.value)} placeholder="People Lead" />
            </Field>
            <Field label="Your role">
              <select value={f.adminRole} onChange={(e) => set("adminRole", e.target.value)}>
                <option value="ADMIN">Owner / Admin</option>
                <option value="HR">HR</option>
                <option value="FINANCE">Finance</option>
              </select>
            </Field>
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
            {pending ? "Setting up…" : "Finish setup"}
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
