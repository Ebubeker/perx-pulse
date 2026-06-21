"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AccountMenu } from "./AccountMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Icon } from "./icons";
import { NAV_PRIMARY, NAV_SECONDARY, isActive, ROLE_HOME, type Role, type NavItem } from "./nav-config";
import type { Locale } from "@/lib/i18n";
import type { Workspace } from "@/lib/account";

export function Sidebar({
  role,
  locale,
  labels,
  pendingCount,
  workspaces,
  active,
}: {
  role: Role;
  locale: Locale;
  labels: Record<string, string>;
  pendingCount: number;
  workspaces: Workspace[];
  active: Workspace;
}) {
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
      <Link href={ROLE_HOME[role]} aria-label="Perx" className="px-5 pb-3 pt-5">
        <Logo />
      </Link>

      {role !== "employee" && workspaces.length > 1 && (
        <div className="px-4 pb-3">
          <WorkspaceSwitcher workspaces={workspaces} active={active} align="left" />
        </div>
      )}

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
