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
      className="btn btn-primary btn-lg disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to my pack →"}
    </button>
  );
}
