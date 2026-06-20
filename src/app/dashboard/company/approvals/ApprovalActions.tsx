"use client";

import { useTransition } from "react";
import { approvePackage, rejectPackage } from "@/lib/approval-actions";

export function ApprovalActions({ packageId }: { packageId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => startTransition(async () => { await approvePackage(packageId); })}
        disabled={pending}
        className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Settling…" : "Approve & pay providers"}
      </button>
      <button
        type="button"
        onClick={() => startTransition(async () => { await rejectPackage(packageId); })}
        disabled={pending}
        className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-muted disabled:opacity-60"
      >
        Decline
      </button>
    </div>
  );
}
