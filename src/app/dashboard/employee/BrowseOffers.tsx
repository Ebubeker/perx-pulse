"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon, type IconName } from "@/components/Icon";
import type { CatalogOffer } from "@/lib/gemini";

const CAT_LABEL: Record<string, string> = {
  all: "All", wellness: "Wellness", fitness: "Fitness", food: "Food", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
};

const CAT_COLOR: Record<string, string> = {
  wellness: "var(--lime)", fitness: "var(--coral)", food: "#E8B339", health: "#7C6BF0",
  travel: "#6E4A34", learning: "var(--ink)", culture: "var(--coral-deep)", telecom: "var(--lime-deep)",
};

const CAT_ICON: Record<string, IconName> = {
  wellness: "wellness", fitness: "fitness", food: "food", health: "health",
  travel: "travel", learning: "learning", culture: "culture", telecom: "telecom",
};

export function BrowseOffers({ offers, initialCategory = "all" }: { offers: CatalogOffer[]; initialCategory?: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(initialCategory);

  const categories = useMemo(() => ["all", ...Array.from(new Set(offers.map((o) => o.category)))], [offers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return offers.filter((o) => {
      if (cat !== "all" && o.category !== cat) return false;
      if (!term) return true;
      return `${o.title} ${o.providerName} ${o.category} ${o.area ?? ""}`.toLowerCase().includes(term);
    });
  }, [offers, q, cat]);

  return (
    <div>
      <div className="search">
        <span className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search perks, providers, areas…" />
      </div>

      {/* category chips — single horizontal scroll row, no scrollbar (not .chip-row, which wraps) */}
      <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-0.5">
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? "on" : ""}`}>
            {CAT_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">{filtered.length} of {offers.length} perks</p>

      {/* voucher cards — 2 columns, taller */}
      <div className="mt-2 grid grid-cols-2 gap-3 md:gap-4">
        {filtered.map((o) => (
          <Link
            key={o.id}
            href={`/dashboard/employee/offer/${o.id}`}
            className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[var(--r-md)] shadow-soft transition active:scale-[.99]"
            style={{ background: CAT_COLOR[o.category] ?? "var(--coral)" }}
          >
            {o.imageUrl ? (
              <Image src={o.imageUrl} alt="" fill sizes="(min-width:768px) 320px, 50vw" unoptimized className="object-cover" />
            ) : (
              <Icon name={CAT_ICON[o.category] ?? "gift"} size={104} className="pointer-events-none absolute -right-3 -top-3 text-white/15" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
            <div className="absolute left-3 top-3 z-[2] flex flex-wrap gap-1.5">
              {o.taxFree && <span className="badge badge-tax">Tax-free</span>}
              {o.discountPct > 0 && <span className="badge badge-new">−{o.discountPct}%</span>}
            </div>
            <div className="relative z-[2] p-3.5 text-white">
              <div className="font-display text-base font-bold leading-tight line-clamp-2">{o.title}</div>
              <div className="truncate text-xs text-white/85">{o.providerName}{o.area ? ` · ${o.area}` : ""}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                {o.discountPct > 0 && <span className="text-xs text-white/60 line-through"><Coins amount={toCoins(o.priceLek)} /></span>}
                <span className="font-display text-lg font-bold"><Coins amount={toCoins(o.effLek)} /></span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-[var(--r-md)] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No perks match that search.</div>
        )}
      </div>
    </div>
  );
}
