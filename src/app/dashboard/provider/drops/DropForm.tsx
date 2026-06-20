"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDrop } from "@/lib/drop-actions";

const CATEGORIES = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"];

export function DropForm({ defaultCategory }: { defaultCategory: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    const input = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      area: formData.get("area"),
      costCoins: formData.get("costCoins"),
      totalSlots: formData.get("totalSlots"),
      hours: formData.get("hours"),
    };
    startTransition(async () => {
      const res = await createDrop(input);
      if (res.error) setError(res.error);
      else { router.refresh(); (document.getElementById("dropform") as HTMLFormElement)?.reset(); }
    });
  }

  return (
    <form id="dropform" action={submit} className="space-y-3">
      <input name="title" placeholder="Flash: free smoothie with any class" required className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      <input name="description" placeholder="Short description (optional)" className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      <div className="flex gap-2">
        <select name="category" defaultValue={defaultCategory} className="min-w-0 flex-1 rounded-lg border border-line bg-cream px-3 py-2.5 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="area" placeholder="Area" className="w-28 rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <label className="flex-1 text-xs text-muted">Cost (coins)
          <input name="costCoins" type="number" min={1} defaultValue={50} required className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
        </label>
        <label className="flex-1 text-xs text-muted">Slots
          <input name="totalSlots" type="number" min={1} defaultValue={10} required className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
        </label>
        <label className="flex-1 text-xs text-muted">Ends in (h)
          <input name="hours" type="number" min={1} defaultValue={48} required className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-60">
        {pending ? "Posting…" : "Post drop"}
      </button>
      {error && <p className="text-sm text-accent">{error}</p>}
    </form>
  );
}
