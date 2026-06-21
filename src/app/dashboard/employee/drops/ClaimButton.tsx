"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimDrop } from "@/lib/drop-actions";

export function ClaimButton({ dropId, disabled, cost }: { dropId: string; disabled?: boolean; cost: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => startTransition(async () => {
          setError(null);
          const res = await claimDrop(dropId);
          if (res.error) setError(res.error);
          else router.refresh(); // card flips to the claimed state with the code
        })}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {pending ? "Claiming…" : disabled ? `Need ${cost} coins` : "Claim now"}
      </button>
      {error && <p className="mt-1.5 text-center text-xs text-coral">{error}</p>}
    </div>
  );
}
