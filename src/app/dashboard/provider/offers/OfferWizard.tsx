"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createOffer, updateOffer, type OfferInputShape } from "@/lib/offer-actions";
import { Mascot } from "@/components/Mascot";
import { CoinIcon } from "@/components/CoinIcon";

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

const inputCls =
  "w-full rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

// Resize an uploaded image client-side to a compact JPEG data-URI (no object storage needed).
function fileToDataUri(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width >= height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
      else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

export interface OfferInitial {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priceCoins?: string;
  discountPct?: string;
  area?: string;
  taxFree?: boolean;
  imageUrl?: string;
  teamSize?: string;
}

const STEPS = ["Basics", "Photo", "Pricing", "Details", "Review"] as const;
const MOODS = ["thinking", "cool", "charged", "love", "celebrate"] as const;

export function OfferWizard({
  providerCategory,
  providerCity,
  initial,
}: {
  providerCategory: string;
  providerCity?: string | null;
  initial?: OfferInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? providerCategory);
  const [priceCoins, setPriceCoins] = useState(initial?.priceCoins ?? "");
  const [discountPct, setDiscountPct] = useState(initial?.discountPct ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [taxFree, setTaxFree] = useState(initial?.taxFree ?? false);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isTeam, setIsTeam] = useState(Boolean(initial?.teamSize));
  const [teamSize, setTeamSize] = useState(initial?.teamSize ?? "4");
  const fileRef = useRef<HTMLInputElement>(null);

  const coins = Number(priceCoins || 0);
  const disc = Math.min(90, Math.max(0, Number(discountPct || 0)));
  const effCoins = Math.round((coins * (100 - disc)) / 100);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImageUrl(await fileToDataUri(file)); } catch { setError("Couldn't read that image."); }
  }

  function go(next: number) {
    setError(null);
    // per-step validation
    if (next > step) {
      if (step === 0 && title.trim().length < 2) return setError("Give the offer a clear title.");
      if (step === 2 && !(coins > 0)) return setError("Set a price in coins.");
    }
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  function submit() {
    setError(null);
    if (title.trim().length < 2) { setStep(0); return setError("Give the offer a clear title."); }
    if (!(coins > 0)) { setStep(2); return setError("Set a price in coins."); }
    const payload: OfferInputShape = {
      title,
      description,
      category,
      priceLek: coins * 100,
      discountPct,
      area,
      taxFree,
      imageUrl: imageUrl || undefined,
      teamSize: isTeam ? Number(teamSize) : undefined,
    };
    startTransition(async () => {
      const res = isEdit ? await updateOffer(initial!.id!, payload) : await createOffer(payload);
      if ("error" in res) { setError(res.error); return; }
      router.push("/dashboard/provider");
      router.refresh();
    });
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="page max-w-2xl">
      <button onClick={() => (step === 0 ? router.push("/dashboard/provider") : go(step - 1))} className="text-sm font-semibold text-muted hover:text-coral">
        ← {step === 0 ? "Back to dashboard" : STEPS[step - 1]}
      </button>

      <div className="mt-3 flex items-center gap-4">
        <Mascot mood={MOODS[step]} size={64} className="shrink-0" />
        <div className="grow">
          <div className="kicker text-coral">{isEdit ? "Edit offer" : "New offer"} · Step {step + 1} of {STEPS.length}</div>
          <h1 className="h1 mt-0.5">{STEPS[step]}</h1>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="card mt-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <Field label="Offer title" hint="What an employee will see in the marketplace.">
                  <input className={inputCls} placeholder="e.g. 60-min deep-tissue massage" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </Field>
                <Field label="Category">
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                  </select>
                </Field>
                <Field label="Description" hint="What's actually included — be specific.">
                  <textarea className={`${inputCls} min-h-28`} placeholder="Two sessions with a certified therapist, towels and tea included…" value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </>
            )}

            {step === 1 && (
              <Field label="Perk photo" hint="A real photo sells the perk. Optional, but recommended.">
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
                {imageUrl ? (
                  <div className="relative overflow-hidden rounded-[18px] border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Perk preview" className="h-52 w-full object-cover" />
                    <button type="button" onClick={() => { setImageUrl(""); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className={`${inputCls} flex h-40 items-center justify-center gap-2 border-dashed text-muted`}>+ Add a photo of this perk</button>
                )}
              </Field>
            )}

            {step === 2 && (
              <>
                <div className="flex gap-3">
                  <Field label="Price (coins)" className="grow">
                    <input className={inputCls} type="number" min={0} placeholder="e.g. 35" value={priceCoins} onChange={(e) => setPriceCoins(e.target.value)} autoFocus />
                  </Field>
                  <Field label="Discount %" className="w-32">
                    <input className={inputCls} type="number" min={0} max={90} placeholder="0" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
                  </Field>
                </div>
                {coins > 0 && (
                  <div className="flex items-center gap-2 rounded-[18px] bg-cream px-4 py-3 text-sm">
                    <span className="text-muted">Employees pay</span>
                    <span className="inline-flex items-center gap-1 font-display text-lg font-bold">
                      <CoinIcon />{effCoins}
                    </span>
                    {disc > 0 && <span className="text-muted line-through">{coins}</span>}
                    {disc > 0 && <span className="badge badge-new">−{disc}%</span>}
                    <span className="ml-auto text-xs text-muted">≈ {(effCoins * 100).toLocaleString("en-US")} L</span>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={taxFree} onChange={(e) => setTaxFree(e.target.checked)} className="accent-coral" /> Tax-free benefit
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Area" hint="Where employees redeem it.">
                  <input className={inputCls} placeholder={providerCity || "e.g. Blloku, Tiranë"} value={area} onChange={(e) => setArea(e.target.value)} />
                </Field>
                <div className="rounded-[18px] border border-line bg-cream p-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)} className="accent-coral" /> Team perk — a group does it together
                  </label>
                  {isTeam && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted">Group size</span>
                      <input className={`${inputCls} !w-24 !py-2`} type="number" min={2} max={50} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
                      <span className="text-xs text-muted">employees rally a crew to unlock it</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-3">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-40 w-full rounded-[18px] object-cover" />
                )}
                <h3 className="font-display text-xl font-bold">{title || "Untitled offer"}</h3>
                {description && <p className="text-sm text-muted">{description}</p>}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-display text-lg font-bold"><CoinIcon />{effCoins}</span>
                  {disc > 0 && <span className="text-muted line-through">{coins}</span>}
                  {disc > 0 && <span className="badge badge-new">−{disc}%</span>}
                  <span className="badge">{category}</span>
                  {area && <span className="text-muted">· {area}</span>}
                  {taxFree && <span className="badge badge-tax">TAX-FREE</span>}
                  {isTeam && <span className="badge badge-new">TEAM · {teamSize}</span>}
                </div>
                <p className="text-xs text-muted">Employees reach you pre-funded and employer-approved — no chargebacks.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm font-medium text-coral">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={() => go(step - 1)} disabled={step === 0} className="btn btn-ghost px-5 disabled:opacity-40">Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => go(step + 1)} className="btn btn-primary px-6">Continue</button>
          ) : (
            <button onClick={submit} disabled={pending} className="btn btn-primary px-6 disabled:opacity-60">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Publish offer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
