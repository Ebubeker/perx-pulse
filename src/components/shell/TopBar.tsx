"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { AccountMenu } from "./AccountMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { resolveHeader, ROLE_HOME, type Role } from "./nav-config";
import type { Locale } from "@/lib/i18n";
import type { Workspace } from "@/lib/account";

export function TopBar({ role, locale, labels, workspaces, active, orgName }: { role: Role; locale: Locale; labels: Record<string, string>; workspaces: Workspace[]; active: Workspace; orgName?: string | null }) {
  const pathname = usePathname() ?? ROLE_HOME[role];
  const { titleKey, back } = resolveHeader(pathname, role);
  const title = labels[titleKey] ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur md:hidden">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {back ? (
            <>
              <Link href={back} aria-label={labels["nav.back"] ?? "Back"} className="-ml-1 flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-cream">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
              </Link>
              <span className="truncate font-display text-[17px] font-bold">{title}</span>
            </>
          ) : (
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <Link href={ROLE_HOME[role]} aria-label="Perx"><Logo /></Link>
              {orgName && (
                <span className="hidden min-w-0 max-w-[34vw] items-center gap-1 truncate rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink-soft min-[360px]:inline-flex">
                  <Icon name="building" size={11} className="shrink-0 text-coral" />
                  <span className="truncate">{orgName}</span>
                </span>
              )}
            </div>
          )}
        </div>
        <WorkspaceSwitcher workspaces={workspaces} active={active} />
        <AccountMenu locale={locale} signOutLabel={labels["action.signout"] ?? "Sign out"} />
      </div>
    </header>
  );
}
