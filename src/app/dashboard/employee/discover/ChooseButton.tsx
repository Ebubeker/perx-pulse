"use client";

import { useTransition } from "react";
import { choosePackage } from "@/lib/pulse-actions";

export function ChooseButton({ recId }: { recId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await choosePackage(recId); })}
      disabled={pending}
      className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Choosing…" : "Choose this pack"}
    </button>
  );
}
