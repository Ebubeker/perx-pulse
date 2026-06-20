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
  const [category, setCategory] = useState(providerCategory);
  const [priceLek, setPriceLek] = useState("");
  const [area, setArea] = useState("");
  const [taxFree, setTaxFree] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await createOffer({ title, category, priceLek, area, taxFree });
      if ("error" in res) {
        setMsg({ error: res.error });
      } else {
        setMsg({ ok: true });
        setTitle("");
        setPriceLek("");
        setArea("");
        setTaxFree(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputCls} placeholder="Offer title (e.g. 60-min massage)" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="flex gap-3">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input className={inputCls} type="number" placeholder="Price (Lek)" value={priceLek} onChange={(e) => setPriceLek(e.target.value)} required />
      </div>
      <input className={inputCls} placeholder="Area (e.g. Blloku)" value={area} onChange={(e) => setArea(e.target.value)} />
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
