import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { AccountType, CompanyRole } from "@/types/globals";

// A "workspace" is a hat the same person can wear. One Clerk user may hold several
// (e.g. a company that is also a provider) — they switch between them in the shell.
export type Workspace = "company" | "employee" | "provider";
export const WS_COOKIE = "perx_ws";
export const WS_HOME: Record<Workspace, string> = {
  company: "/dashboard/company",
  employee: "/dashboard/employee",
  provider: "/dashboard/provider",
};

/** Account-type, onboarding, and invite flags from Clerk metadata (read fresh). */
export async function getAccount() {
  const user = await currentUser();
  if (!user) return null;
  const pm = user.publicMetadata;
  const accountType: AccountType | null =
    pm.accountType === "company" || pm.accountType === "provider" ? pm.accountType : null;
  return {
    userId: user.id,
    accountType,
    onboardingComplete: pm.onboardingComplete === true,
    invitedToCompanyId: typeof pm.invitedToCompanyId === "string" ? pm.invitedToCompanyId : null,
    invitedRole: (pm.invitedRole as CompanyRole | undefined) ?? null,
    invitationId: typeof pm.invitationId === "string" ? pm.invitationId : null,
  };
}

export async function requireAccount() {
  const a = await getAccount();
  if (!a) redirect("/sign-in");
  return a;
}

/** The current user's company seat (admin or employee) + company + department. */
export async function getMembership() {
  const user = await currentUser();
  if (!user) return null;
  return prisma.employeeProfile.findFirst({
    where: { clerkUserId: user.id },
    include: { company: true, department: true },
    orderBy: { createdAt: "asc" },
  });
}

/** The current user's provider profile, if any. */
export async function getProvider() {
  const user = await currentUser();
  if (!user) return null;
  return prisma.provider.findUnique({ where: { clerkUserId: user.id } });
}

/** Gate provider surfaces — must be an onboarded provider. Returns the provider. */
export async function requireProvider() {
  const p = await getProvider();
  if (!p) redirect("/onboarding");
  return p;
}

/** Gate employee surfaces — must have a company seat. Returns the membership (+ company). */
export async function requireMembership() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  return m;
}

/** Gate company-admin surfaces — must be an ADMIN or HR member. Returns the membership. */
export async function requireCompanyAdmin() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  if (m.role !== "ADMIN" && m.role !== "HR") redirect("/dashboard");
  return m;
}

/**
 * Every workspace this user can access, derived from real DB rows (not the single
 * `accountType` flag). A company admin who also has a Provider profile gets both.
 * Order matters: the first entry is the default landing workspace.
 */
export async function getWorkspaces() {
  const user = await currentUser();
  if (!user) return null;
  const [membership, provider] = await Promise.all([
    prisma.employeeProfile.findFirst({
      where: { clerkUserId: user.id },
      include: { company: true, department: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.provider.findUnique({ where: { clerkUserId: user.id } }),
  ]);
  const available: Workspace[] = [];
  if (membership) available.push(membership.role === "EMPLOYEE" ? "employee" : "company");
  if (provider) available.push("provider");
  return { userId: user.id, membership, provider, available };
}

/** The workspace the user is currently viewing: their saved preference, else the default. */
export async function getActiveWorkspace(available: Workspace[]): Promise<Workspace | null> {
  if (available.length === 0) return null;
  const pref = (await cookies()).get(WS_COOKIE)?.value;
  if (pref && (available as string[]).includes(pref)) return pref as Workspace;
  return available[0] ?? null;
}
