"use client";

import { useTransition } from "react";
import { swapItem } from "@/lib/pulse-actions";

export function SwapButton({ packageId, offerId }: { packageId: string; offerId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await swapItem(packageId, offerId); })}
      disabled={pending}
      className="rounded-full bg-coral-soft px-3 py-1.5 text-xs font-bold text-coral-deep disabled:opacity-50"
    >
      {pending ? "…" : "Swap"}
    </button>
  );
}
