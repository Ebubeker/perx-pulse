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
          className="btn btn-primary flex-1 disabled:opacity-60"
        >
          {pending ? "Settling…" : "Approve & fund"}
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { setError(null); await rejectPackage(packageId); })}
          disabled={pending}
          className="btn btn-ghost disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
