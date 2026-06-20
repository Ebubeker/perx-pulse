"use client";

import { useTransition, useState } from "react";
import { startCheckout } from "@/lib/billing-actions";

export function SubscribeButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => startTransition(async () => {
          setError(null);
          const res = await startCheckout();
          if (res?.error) setError(res.error);
        })}
        disabled={pending}
        className="w-full rounded-xl bg-primary py-4 text-[15px] font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Opening checkout…" : "Subscribe to Perx"}
      </button>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
