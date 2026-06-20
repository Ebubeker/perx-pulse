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
      className="btn btn-primary disabled:opacity-60"
    >
      {pending ? "Choosing…" : "Choose pack"}
    </button>
  );
}
