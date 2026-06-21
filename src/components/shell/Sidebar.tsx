"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AccountMenu } from "./AccountMenu";
import { Icon } from "./icons";
import { NAV_PRIMARY, NAV_SECONDARY, isActive, ROLE_HOME, type Role, type NavItem } from "./nav-config";
import type { Locale } from "@/lib/i18n";

export function Sidebar({ role, locale, labels, pendingCount, orgName }: { role: Role; locale: Locale; labels: Record<string, string>; pendingCount: number; orgName?: string | null }) {
  const pathname = usePathname() ?? ROLE_HOME[role];

  const Row = ({ item }: { item: NavItem }) => {
    const active = isActive(pathname, item);
    const showBadge = item.badge === "approvals" && pendingCount > 0;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? "bg-primary-soft font-medium text-primary" : "text-ink-soft hover:bg-cream"}`}
      >
        <Icon name={item.icon} size={20} />
        <span className="flex-1 truncate">{labels[item.labelKey] ?? item.key}</span>
        {showBadge && <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-bold text-white">{pendingCount}</span>}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-paper md:flex">
      <div className="px-5 pb-4 pt-5">
        <Link href={ROLE_HOME[role]} aria-label="Perx"><Logo /></Link>
        {orgName && (
          <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink-soft">
            <Icon name="building" size={13} className="shrink-0 text-coral" />
            <span className="truncate">{orgName}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_PRIMARY[role].map((item) => <Row key={item.key} item={item} />)}
        {NAV_SECONDARY[role].length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">{labels["nav.more"] ?? "More"}</div>
            {NAV_SECONDARY[role].map((item) => <Row key={item.key} item={item} />)}
          </>
        )}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <AccountMenu locale={locale} signOutLabel={labels["action.signout"] ?? "Sign out"} />
      </div>
    </aside>
  );
}
