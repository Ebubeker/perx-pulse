import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAccount, getMembership, getProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getLocale, getShellLabels } from "@/lib/i18n";
import { AppShell } from "@/components/shell/AppShell";
import type { Role } from "@/components/shell/nav-config";

export const dynamic = "force-dynamic";

/**
 * The single shell mount for everything under /dashboard. Resolves role server-side
 * (mirrors dashboard/page.tsx), counts pending approvals for the badge, and wraps every
 * page in the persistent nav. Per-page requireX() guards stay as the hard server gate.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (!account) redirect("/sign-in");
  if (!account.onboardingComplete) redirect("/onboarding");

  let role: Role;
  let pendingCount = 0;
  let orgName: string | null = null;

  if (account.accountType === "provider") {
    role = "provider";
    const provider = await getProvider();
    orgName = provider?.businessName ?? null;
  } else {
    const membership = await getMembership();
    orgName = membership ? membership.company.brandName || membership.company.name : null;
    if (membership?.role === "EMPLOYEE") {
      role = "employee";
    } else {
      role = "company";
      if (membership) {
        pendingCount = await prisma.perkPackage.count({
          where: { companyId: membership.companyId, status: "PENDING" },
        });
      }
    }
  }

  const [locale, labels] = await Promise.all([getLocale(), getShellLabels()]);

  return (
    <AppShell role={role} locale={locale} labels={labels} pendingCount={pendingCount} orgName={orgName}>
      {children}
    </AppShell>
  );
}
