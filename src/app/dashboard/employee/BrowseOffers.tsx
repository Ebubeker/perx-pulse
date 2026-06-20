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
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search perks, providers, areas…"
          className="w-full rounded-[var(--r-md)] border-[1.5px] border-line bg-cream py-3.5 pl-11 pr-4 text-[15px] focus:border-coral focus:outline-none"
        />
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
      <div className="mt-2">
        {filtered.map((o) => {
          const on = selected.includes(o.id);
          return (
            <div key={o.id} className={`row ${on ? "!border-coral" : ""}`}>
              <Link href={`/dashboard/employee/offer/${o.id}`} className="grow">
                <div className="t truncate underline-offset-2 hover:underline">{o.title}</div>
                <div className="s truncate">
                  {o.providerName}{o.area ? ` · ${o.area}` : ""} · {CAT_LABEL[o.category] ?? o.category}
                  {o.taxFree ? " · tax-free" : ""}
                  {o.discountPct > 0 ? ` · −${o.discountPct}%` : ""}
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-right text-sm">
                  {o.discountPct > 0 && <Coins amount={toCoins(o.priceLek)} strike className="mr-1 text-xs" />}
                  <Coins amount={toCoins(o.effLek)} className="amt" />
                </span>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`flex size-8 items-center justify-center rounded-full border-[1.5px] text-lg font-bold transition ${on ? "border-coral bg-coral text-white" : "border-line text-coral"}`}
                >
                  {on ? "✓" : "+"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="row justify-center py-6 text-center text-sm text-muted">No perks match that search.</div>
        )}
      </div>
    </div>
  );
}
