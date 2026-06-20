"use client";

import { useTransition } from "react";
import { choosePackage } from "@/lib/pulse-actions";

// The whole AI-pack card is the button: tapping it chooses the pack.
export function ChoosePackCard({ recId, className = "", children }: { recId: string; className?: string; children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await choosePackage(recId); })}
      disabled={pending}
      aria-busy={pending}
      className={`${className} text-left transition active:scale-[.99] disabled:cursor-progress`}
    >
      {children}
      {pending && (
        <span className="absolute inset-0 z-[3] grid place-items-center bg-black/45 font-display text-sm font-semibold text-white">
          Choosing…
        </span>
      )}
    </button>
  );
}
