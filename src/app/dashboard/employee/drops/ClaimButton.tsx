"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimDrop } from "@/lib/drop-actions";

export function ClaimButton({ dropId, disabled }: { dropId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => startTransition(async () => {
          setMsg(null);
          const res = await claimDrop(dropId);
          if (res.error) setMsg({ text: res.error });
          else { setMsg({ ok: true, text: `Claimed! Code ${res.code}` }); router.refresh(); }
        })}
        className="btn btn-primary btn-lg disabled:opacity-50"
      >
        {pending ? "Claiming…" : "Claim with coins"}
      </button>
      {msg && <p className={`mt-1.5 text-sm font-semibold ${msg.ok ? "text-coral" : "text-coral-deep"}`}>{msg.text}</p>}
    </div>
  );
}
