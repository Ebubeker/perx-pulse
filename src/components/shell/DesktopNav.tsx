"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allItems, isActive, ROLE_HOME, type Role } from "./nav-config";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/lib/i18n";

// Design's desktop top-nav (.dnav) for the employer & provider apps.
export function DesktopNav({
  role,
  locale,
  labels,
  pendingCount,
  orgName,
}: {
  role: Role;
  locale: Locale;
  labels: Record<string, string>;
  pendingCount: number;
  orgName?: string | null;
}) {
  const pathname = usePathname() ?? ROLE_HOME[role];
  const items = allItems(role);

  return (
    <header className="dnav">
      <Link href={ROLE_HOME[role]} aria-label="Perx"><Logo /></Link>
      <span className="kicker hidden sm:inline" style={{ marginLeft: 2 }}>{orgName ? `${orgName} · ` : ""}{role === "provider" ? "Provider" : "Employer"}</span>
      <span className="spacer" />
      <nav className="flex items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const showBadge = item.badge === "approvals" && pendingCount > 0;
          return (
            <Link key={item.key} href={item.href} className={`navlink whitespace-nowrap ${active ? "on" : ""}`}>
              {labels[item.labelKey] ?? item.key}
              {showBadge ? ` · ${pendingCount}` : ""}
            </Link>
          );
        })}
      </nav>
      <AccountMenu locale={locale} signOutLabel={labels["action.signout"] ?? "Sign out"} />
    </header>
  );
}
