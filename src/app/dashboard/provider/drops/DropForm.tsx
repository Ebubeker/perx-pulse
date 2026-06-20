"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDrop } from "@/lib/drop-actions";

const CATEGORIES = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"];
const inputCls = "w-full rounded-[18px] border-[1.5px] border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-coral";

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
      <input name="title" placeholder="Flash: free smoothie with any class" required className={inputCls} />
      <input name="description" placeholder="Short description (optional)" className={inputCls} />
      <div className="flex gap-2">
        <select name="category" defaultValue={defaultCategory} className={`min-w-0 flex-1 ${inputCls}`}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="area" placeholder="Area" className={`w-28 ${inputCls}`} />
      </div>
      <div className="flex gap-2">
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Cost (coins)</span>
          <input name="costCoins" type="number" min={1} defaultValue={50} required />
        </label>
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Slots</span>
          <input name="totalSlots" type="number" min={1} defaultValue={10} required />
        </label>
        <label className="field mb-0 flex-1"><span className="kicker mb-1.5 block">Ends in (h)</span>
          <input name="hours" type="number" min={1} defaultValue={48} required />
        </label>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg disabled:opacity-60">
        {pending ? "Posting…" : "Post drop"}
      </button>
      {error && <p className="text-sm font-medium text-coral">{error}</p>}
    </form>
  );
}
