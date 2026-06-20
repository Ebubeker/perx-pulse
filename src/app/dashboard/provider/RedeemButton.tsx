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
      className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50"
    >
      {pending ? "…" : "Redeem"}
    </button>
  );
}
