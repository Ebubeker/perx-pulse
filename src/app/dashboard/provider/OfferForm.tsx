"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
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
const inputCls = "w-full rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

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
  const [imageUrl, setImageUrl] = useState("");
  const [isTeam, setIsTeam] = useState(false);
  const [teamSize, setTeamSize] = useState("4");
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImageUrl(await fileToDataUri(file)); } catch { setMsg({ error: "Couldn't read that image." }); }
  }

  function reset() {
    setTitle(""); setDescription(""); setPriceCoins(""); setDiscountPct(""); setArea("");
    setTaxFree(false); setImageUrl(""); setIsTeam(false); setTeamSize("4");
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await createOffer({
        title, description, category,
        priceLek: Number(priceCoins || 0) * 100,
        discountPct, area, taxFree,
        imageUrl: imageUrl || undefined,
        teamSize: isTeam ? Number(teamSize) : undefined,
      });
      if ("error" in res) setMsg({ error: res.error });
      else { setMsg({ ok: true }); reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputCls} placeholder="Offer title (e.g. 60-min massage)" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea className={`${inputCls} min-h-20`} placeholder="Describe what's included — what the employee actually gets" value={description} onChange={(e) => setDescription(e.target.value)} />

      {/* image upload */}
      <div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-[18px] border border-line">
            {/* preview can be a data-URI or URL → plain img keeps it simple */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Perk preview" className="h-40 w-full object-cover" />
            <button type="button" onClick={() => { setImageUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute right-2 top-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">Remove</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className={`${inputCls} flex items-center justify-center gap-2 border-dashed text-muted`}>
            + Add a photo of this perk
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
        </select>
        <input className={inputCls} type="number" min={0} placeholder="Price (coins)" value={priceCoins} onChange={(e) => setPriceCoins(e.target.value)} required />
      </div>
      <div className="flex gap-3">
        <input className={inputCls} placeholder="Area (e.g. Blloku)" value={area} onChange={(e) => setArea(e.target.value)} />
        <input className={inputCls} type="number" min={0} max={90} placeholder="Discount %" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={taxFree} onChange={(e) => setTaxFree(e.target.checked)} className="accent-coral" /> Tax-free benefit
      </label>

      {/* team perk */}
      <div className="rounded-[18px] border border-line bg-cream p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)} className="accent-coral" /> Team perk — needs a group to do together
        </label>
        {isTeam && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-sm text-muted">Group size</span>
            <input className={`${inputCls} !w-24 !py-2`} type="number" min={2} max={50} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
            <span className="text-xs text-muted">employees rally a crew to unlock it</span>
          </div>
        )}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">{pending ? "Adding…" : "Add offer"}</button>
      {msg?.ok && <p className="text-sm font-medium text-lime-deep">Offer added.</p>}
      {msg?.error && <p className="text-sm font-medium text-coral">{msg.error}</p>}
    </form>
  );
}
