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
        className="btn btn-primary disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : "Subscribe to Perx"}
      </button>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
