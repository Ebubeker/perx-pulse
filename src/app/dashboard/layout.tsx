import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAccount, getWorkspaces, getActiveWorkspace } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getLocale, getShellLabels } from "@/lib/i18n";
import { AppShell } from "@/components/shell/AppShell";
import type { Role } from "@/components/shell/nav-config";

export const dynamic = "force-dynamic";

/**
 * The single shell mount for everything under /dashboard. Resolves the active workspace
 * (the hat the user is currently wearing) from their real capabilities + saved preference,
 * counts pending approvals for the badge, and wraps every page in the persistent nav.
 * Per-page requireX() guards stay as the hard server gate.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (!account.onboardingComplete) redirect("/onboarding");

  const w = await getWorkspaces();
  if (!w || w.available.length === 0) redirect("/onboarding");
  const active = await getActiveWorkspace(w.available);
  const role: Role = active === "employee" ? "employee" : active === "provider" ? "provider" : "company";

  let pendingCount = 0;
  if (active === "company" && w.membership) {
    pendingCount = await prisma.perkPackage.count({
      where: { companyId: w.membership.companyId, status: "PENDING" },
    });
  }

  const [locale, labels] = await Promise.all([getLocale(), getShellLabels()]);

  return (
    <AppShell
      role={role}
      locale={locale}
      labels={labels}
      pendingCount={pendingCount}
      workspaces={w.available}
      active={active!}
    >
      {children}
    </AppShell>
  );
}
