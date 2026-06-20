"use client";

import { useMemo, useState, useTransition } from "react";
import { requestOffers } from "@/lib/pulse-actions";
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

export function BrowseOffers({ offers }: { offers: CatalogOffer[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
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
    return offers.filter((o) => set.has(o.id)).reduce((s, o) => s + o.priceLek, 0);
  }, [offers, selected]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search perks, providers, areas…"
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === c ? "border-primary bg-primary text-white" : "border-line bg-paper text-muted"}`}
          >
            {CAT_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="sticky top-16 z-20 mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">
            {selected.length} selected · {selTotal.toLocaleString("en-US")} L
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected([])} className="text-xs font-semibold text-muted">
              Clear
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(async () => { await requestOffers(selected); })}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "…" : "Request"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">{filtered.length} of {offers.length} perks</p>
      <ul className="mt-2 space-y-2">
        {filtered.map((o) => {
          const on = selected.includes(o.id);
          return (
            <li
              key={o.id}
              className={`flex items-center justify-between gap-3 rounded-xl border bg-paper px-4 py-3 ${on ? "border-primary" : "border-line"}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="truncate text-xs text-muted">
                  {o.providerName}{o.area ? ` · ${o.area}` : ""} · {CAT_LABEL[o.category] ?? o.category}
                  {o.taxFree ? " · tax-free" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-ink-soft">{o.priceLek.toLocaleString("en-US")} L</span>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`flex size-8 items-center justify-center rounded-full border text-lg font-bold ${on ? "border-primary bg-primary text-white" : "border-line text-primary"}`}
                >
                  {on ? "✓" : "+"}
                </button>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No perks match that search.</li>
        )}
      </ul>
    </div>
  );
}
