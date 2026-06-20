"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Icon } from "./icons";
import type { Locale } from "@/lib/i18n";

/** Compact right-cluster: language toggle + sign-out. Present on every dashboard page. */
export function AccountMenu({ locale, signOutLabel }: { locale: Locale; signOutLabel: string }) {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <LocaleSwitcher current={locale} />
      <button
        type="button"
        title={signOutLabel}
        aria-label={signOutLabel}
        disabled={pending}
        onClick={() => { setPending(true); void signOut({ redirectUrl: "/" }); }}
        className="flex size-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink disabled:opacity-50"
      >
        <Icon name="logout" size={18} />
      </button>
    </div>
  );
}
