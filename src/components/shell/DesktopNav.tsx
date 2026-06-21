"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allItems, isActive, ROLE_HOME, type Role } from "./nav-config";
import { AccountMenu } from "./AccountMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/lib/i18n";
import type { Workspace } from "@/lib/account";

// Design's desktop top-nav (.dnav) for the employer & provider apps.
export function DesktopNav({
  role,
  locale,
  labels,
  pendingCount,
  workspaces,
  active,
  orgName,
}: {
  role: Role;
  locale: Locale;
  labels: Record<string, string>;
  pendingCount: number;
  workspaces: Workspace[];
  active: Workspace;
  orgName?: string | null;
}) {
  const pathname = usePathname() ?? ROLE_HOME[role];
  const items = allItems(role);

  return (
    <header className="dnav md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <Link href={ROLE_HOME[role]} aria-label="Perx" className="shrink-0"><Logo /></Link>
        <span className="kicker mr-1 hidden sm:inline">{orgName ? `${orgName} · ` : ""}{role === "provider" ? "Provider" : "Employer"}</span>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
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
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <WorkspaceSwitcher workspaces={workspaces} active={active} />
          <AccountMenu locale={locale} signOutLabel={labels["action.signout"] ?? "Sign out"} />
        </div>
      </div>
    </header>
  );
}
