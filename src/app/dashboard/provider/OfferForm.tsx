"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/lib/offer-actions";

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
const inputCls = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary";

export function OfferForm({ providerCategory }: { providerCategory: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(providerCategory);
  const [priceCoins, setPriceCoins] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [area, setArea] = useState("");
  const [taxFree, setTaxFree] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await createOffer({ title, description, category, priceLek: Number(priceCoins || 0) * 100, discountPct, area, taxFree });
      if ("error" in res) {
        setMsg({ error: res.error });
      } else {
        setMsg({ ok: true });
        setTitle("");
        setDescription("");
        setPriceCoins("");
        setDiscountPct("");
        setArea("");
        setTaxFree(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputCls} placeholder="Offer title (e.g. 60-min massage)" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea className={`${inputCls} min-h-20`} placeholder="Describe what's included — what the employee actually gets" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-3">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input className={inputCls} type="number" min={0} placeholder="Price (coins)" value={priceCoins} onChange={(e) => setPriceCoins(e.target.value)} required />
      </div>
      <div className="flex gap-3">
        <input className={inputCls} placeholder="Area (e.g. Blloku)" value={area} onChange={(e) => setArea(e.target.value)} />
        <input className={inputCls} type="number" min={0} max={90} placeholder="Discount %" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={taxFree} onChange={(e) => setTaxFree(e.target.checked)} /> Tax-free benefit
      </label>
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">
        {pending ? "Adding…" : "Add offer"}
      </button>
      {msg?.ok && <p className="text-sm font-medium text-primary">Offer added.</p>}
      {msg?.error && <p className="text-sm font-medium text-accent">{msg.error}</p>}
    </form>
  );
}
