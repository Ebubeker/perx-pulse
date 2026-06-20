import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomTabBar } from "./BottomTabBar";
import { Sidebar } from "./Sidebar";
import { GenieFab } from "./GenieFab";
import { DesktopNav } from "./DesktopNav";
import type { Role } from "./nav-config";
import type { Locale } from "@/lib/i18n";

/**
 * Role-aware shell, matching the design:
 *  - employee  → mobile-first app (bottom tab bar, sidebar on desktop, top bar, Genie FAB)
 *  - employer / provider → desktop dashboard with the top nav (.dnav) and a wide page body
 */
export function AppShell({
  role,
  locale,
  labels,
  pendingCount,
  children,
}: {
  role: Role;
  locale: Locale;
  labels: Record<string, string>;
  pendingCount: number;
  children: ReactNode;
}) {
  if (role === "company" || role === "provider") {
    return (
      <div className="min-h-dvh">
        <DesktopNav role={role} locale={locale} labels={labels} pendingCount={pendingCount} />
        <div className="pb-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:pl-60">
      <Sidebar role={role} locale={locale} labels={labels} pendingCount={pendingCount} />
      <TopBar role={role} locale={locale} labels={labels} />
      <div className="pb-24 md:pb-10">{children}</div>
      <BottomTabBar role={role} labels={labels} pendingCount={pendingCount} />
      <GenieFab label={labels["nav.genie"] ?? "Genie"} />
    </div>
  );
}
