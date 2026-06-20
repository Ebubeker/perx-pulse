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
      className="swap disabled:opacity-50"
    >
      {pending ? "…" : "Swap"}
    </button>
  );
}
