import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomTabBar } from "./BottomTabBar";
import { Sidebar } from "./Sidebar";
import { GenieFab } from "./GenieFab";
import type { Role } from "./nav-config";
import type { Locale } from "@/lib/i18n";

/**
 * The persistent shell: responsive nav (bottom tabs on mobile, sidebar on desktop) + a sticky
 * top bar with title/back + language toggle + sign-out. Pages stay server components inside it.
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
  return (
    <div className="min-h-dvh md:pl-60">
      <Sidebar role={role} locale={locale} labels={labels} pendingCount={pendingCount} />
      <TopBar role={role} locale={locale} labels={labels} />
      <div className="pb-24 md:pb-10">{children}</div>
      <BottomTabBar role={role} labels={labels} pendingCount={pendingCount} />
      {role === "employee" && <GenieFab label={labels["nav.genie"] ?? "Genie"} />}
    </div>
  );
}
