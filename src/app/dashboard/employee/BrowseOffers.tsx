"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { requestOffers } from "@/lib/pulse-actions";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import type { CatalogOffer } from "@/lib/gemini";

const CAT_LABEL: Record<string, string> = {
  all: "All",
  wellness: "Wellness",
  fitness: "Fitness",
  food: "Food",
  health: "Health",
  travel: "Travel",
  learning: "Learning",
  culture: "Culture",
  telecom: "Telecom",
};

const CAT_COLOR: Record<string, string> = {
  wellness: "var(--lime)",
  fitness: "var(--coral)",
  food: "#E8B339",
  health: "var(--violet, #7C6BF0)",
  travel: "var(--brown, #6E4A34)",
  learning: "var(--ink)",
  culture: "var(--coral-deep)",
  telecom: "var(--lime-deep)",
};

export function BrowseOffers({ offers, initialCategory = "all", walletCoins = 0 }: { offers: CatalogOffer[]; initialCategory?: string; walletCoins?: number }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(initialCategory);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(offers.map((o) => o.category)))],
    [offers],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return offers.filter((o) => {
      if (cat !== "all" && o.category !== cat) return false;
      if (!term) return true;
      return `${o.title} ${o.providerName} ${o.category} ${o.area ?? ""}`.toLowerCase().includes(term);
    });
  }, [offers, q, cat]);

  const selTotal = useMemo(() => {
    const set = new Set(selected);
    return offers.filter((o) => set.has(o.id)).reduce((s, o) => s + o.effLek, 0);
  }, [offers, selected]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <div className="search">
        <span className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search perks, providers, areas…" />
      </div>

      <div className="chip-row mt-3 flex-nowrap overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`chip shrink-0 ${cat === c ? "on" : ""}`}
          >
            {CAT_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      {selected.length > 0 && (() => {
        const selCoins = toCoins(selTotal);
        const over = selCoins > walletCoins;
        return (
          <div className={`sticky top-16 z-20 mt-3 rounded-[var(--r-md)] border px-4 py-3 ${over ? "border-coral/40 bg-coral-soft" : "border-lime/50 bg-lime-soft"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex items-center gap-1 text-sm font-bold ${over ? "text-coral-deep" : "text-lime-deep"}`}>
                {selected.length} selected · <Coins amount={selCoins} />
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelected([])} className="text-xs font-semibold text-muted">Clear</button>
                <button
                  type="button"
                  disabled={pending || over}
                  onClick={() => startTransition(async () => { await requestOffers(selected); })}
                  className="btn btn-dark px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  {pending ? "…" : "Request"}
                </button>
              </div>
            </div>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
              {over ? <>Over your {walletCoins}<CoinIcon className="size-[0.85em]" /> balance — deselect some.</> : <>You have {walletCoins}<CoinIcon className="size-[0.85em]" /></>}
            </p>
          </div>
        );
      })()}

      <p className="mt-3 text-xs text-muted">{filtered.length} of {offers.length} perks</p>
      <div className="pkggrid mt-2">
        {filtered.map((o) => {
          const on = selected.includes(o.id);
          return (
            <div key={o.id} className={`pkg ${on ? "ring-2 ring-coral" : ""}`}>
              <div className="pkg-bar" style={{ background: CAT_COLOR[o.category] ?? "var(--coral)" }} />
              <button
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={on}
                aria-label={on ? "Deselect" : "Select"}
                className={`absolute right-2.5 top-3 z-[2] flex size-7 items-center justify-center rounded-full border-[1.5px] text-base font-bold transition ${on ? "border-coral bg-coral text-white" : "border-line bg-white text-coral"}`}
              >
                {on ? "✓" : "+"}
              </button>
              <Link href={`/dashboard/employee/offer/${o.id}`} className="pkg-bd block">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {o.taxFree && <span className="badge badge-tax">Tax-free</span>}
                  {o.discountPct > 0 && <span className="badge badge-new">−{o.discountPct}%</span>}
                </div>
                <div className="pkg-name line-clamp-2 pr-7">{o.title}</div>
                <div className="pkg-meta truncate">{o.providerName}{o.area ? ` · ${o.area}` : ""}</div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  {o.discountPct > 0 && <Coins amount={toCoins(o.priceLek)} strike className="text-xs" />}
                  <Coins amount={toCoins(o.effLek)} className="font-display text-[17px] font-bold text-ink" />
                </div>
              </Link>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-[var(--r-md)] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No perks match that search.</div>
        )}
      </div>
    </div>
  );
}
