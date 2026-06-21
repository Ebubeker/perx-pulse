"use client";

import Image from "next/image";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateCompanySettings } from "@/lib/company-actions";
import { CoinIcon } from "@/components/CoinIcon";
import { Icon } from "@/components/Icon";

const inputCls = "w-full rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

// Resize an uploaded logo client-side to a compact JPEG data-URI (no object storage needed).
function fileToDataUri(file: File, maxDim = 512, quality = 0.85): Promise<string> {
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

type Company = {
  name: string;
  brandName: string;
  logoUrl: string;
  industry: string;
  website: string;
  addressLine: string;
  city: string;
  monthlySpreadCoins: number;
};

export function CompanySettingsForm({ company, employeeCount }: { company: Company; employeeCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(company.name);
  const [brandName, setBrandName] = useState(company.brandName);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl);
  const [industry, setIndustry] = useState(company.industry);
  const [website, setWebsite] = useState(company.website);
  const [addressLine, setAddressLine] = useState(company.addressLine);
  const [city, setCity] = useState(company.city);
  const [spread, setSpread] = useState(String(company.monthlySpreadCoins));
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const spreadNum = parseInt(spread || "0", 10) || 0;
  const monthlyDraw = spreadNum * employeeCount;

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setLogoUrl(await fileToDataUri(file)); } catch { setMsg({ text: "Couldn't read that image." }); }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateCompanySettings({
        name, brandName, logoUrl, industry, website, addressLine, city,
        monthlySpreadCoins: spreadNum,
      });
      if (res.error) setMsg({ text: res.error });
      else { setMsg({ ok: true, text: "Settings saved ✓" }); router.refresh(); }
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-6">
      {/* Profile */}
      <section className="card">
        <div className="kicker">Profile</div>
        <h3 className="mt-0.5 font-display text-lg font-extrabold">Company details</h3>

        {/* logo */}
        <div className="mt-4 flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-cream">
            {logoUrl ? <Image src={logoUrl} alt="" width={64} height={64} unoptimized className="size-full object-cover" /> : <Icon name="building" size={24} className="text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-soft">Upload logo</button>
            {logoUrl && <button type="button" onClick={() => { setLogoUrl(""); if (fileRef.current) fileRef.current.value = ""; }} className="text-sm text-muted hover:text-coral">Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickLogo} className="hidden" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Company name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Acme sh.p.k." />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Brand name <span className="font-normal text-muted">(shown to employees)</span></span>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputCls} placeholder="Acme" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Industry</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} placeholder="Software" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Website</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="acme.al" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Address</span>
            <input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className={inputCls} placeholder="Rr. e Kavajës 1" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Tiranë" />
          </label>
        </div>
      </section>

      {/* Program — the monthly coin spread */}
      <section className="card">
        <div className="kicker">Recognition program</div>
        <h3 className="mt-0.5 font-display text-lg font-extrabold">Monthly coin spread</h3>
        <p className="mt-1 text-sm text-muted">How many coins each employee receives every month. Distributed from your treasury on the Recognition page.</p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">Coins per employee / month</span>
            <div className="flex items-center gap-2">
              <input type="number" min={0} value={spread} onChange={(e) => setSpread(e.target.value)} className="w-32 rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral" />
              <CoinIcon className="size-5 text-coral" />
            </div>
          </label>
          <div className="rounded-[18px] bg-cream px-4 py-3 text-sm">
            <div className="text-muted">This month, for {employeeCount} {employeeCount === 1 ? "employee" : "employees"}</div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 font-display text-lg font-bold">
              {monthlyDraw.toLocaleString("en-US")}<CoinIcon className="size-4" /> <span className="text-sm font-normal text-muted">= {(monthlyDraw * 100).toLocaleString("en-US")} Lek</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg disabled:opacity-50">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-lime-deep" : "text-coral"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
