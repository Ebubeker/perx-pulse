"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimDrop } from "@/lib/drop-actions";

export function ClaimButton({ dropId, disabled }: { dropId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => startTransition(async () => {
          setMsg(null);
          const res = await claimDrop(dropId);
          if (res.error) setMsg({ text: res.error });
          else { setMsg({ ok: true, text: `Claimed! Code ${res.code}` }); router.refresh(); }
        })}
        className="btn btn-primary px-[18px] py-[9px] text-sm disabled:opacity-50"
      >
        {pending ? "Claiming…" : "Claim"}
      </button>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-coral" : "text-coral-deep"}`}>{msg.text}</p>}
    </div>
  );
}
