"use client";

import { useTransition } from "react";
import { requestOffers } from "@/lib/pulse-actions";

export function AddOfferButton({ offerId }: { offerId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await requestOffers([offerId]); })}
      className="w-full rounded-xl bg-primary py-4 text-[15px] font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to my pack →"}
    </button>
  );
}
