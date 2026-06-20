"use client";

import { useState, useTransition } from "react";
import { approvePackage, rejectPackage } from "@/lib/approval-actions";

export function ApprovalActions({ packageId }: { packageId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startTransition(async () => { setError(null); const r = await approvePackage(packageId); if (r?.error) setError(r.error); })}
          disabled={pending}
          className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Settling…" : "Approve & pay providers"}
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { setError(null); await rejectPackage(packageId); })}
          disabled={pending}
          className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-muted disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
