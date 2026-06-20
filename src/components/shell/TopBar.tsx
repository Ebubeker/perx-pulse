"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { AccountMenu } from "./AccountMenu";
import { resolveHeader, ROLE_HOME, type Role } from "./nav-config";
import type { Locale } from "@/lib/i18n";

export function TopBar({ role, locale, labels }: { role: Role; locale: Locale; labels: Record<string, string> }) {
  const pathname = usePathname() ?? ROLE_HOME[role];
  const { titleKey, back } = resolveHeader(pathname, role);
  const title = labels[titleKey] ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {back ? (
            <Link href={back} aria-label={labels["nav.back"] ?? "Back"} className="-ml-1 flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-cream">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
            </Link>
          ) : (
            <Link href={ROLE_HOME[role]} className="flex items-center gap-1.5 md:hidden" aria-label="Perx">
              <Mascot size={26} />
            </Link>
          )}
          <span className="truncate font-display text-[15px] font-semibold">{title}</span>
        </div>
        <AccountMenu locale={locale} signOutLabel={labels["action.signout"] ?? "Sign out"} />
      </div>
    </header>
  );
}
