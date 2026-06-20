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
      className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-primary disabled:opacity-50"
    >
      {pending ? "…" : "Swap"}
    </button>
  );
}
