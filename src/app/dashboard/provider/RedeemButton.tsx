"use client";

import { useTransition } from "react";
import { markRedeemed } from "@/lib/approval-actions";

export function RedeemButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await markRedeemed(orderId); })}
      disabled={pending}
      className="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50"
    >
      {pending ? "…" : "Redeem"}
    </button>
  );
}
