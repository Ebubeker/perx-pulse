"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n-actions";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "sq", label: "SQ" },
];

export function LocaleSwitcher({ current }: { current: Locale }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-line text-xs font-semibold">
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await setLocale(o.code); router.refresh(); })}
          className={`px-3 py-1.5 transition ${current === o.code ? "bg-primary text-white" : "bg-paper text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
