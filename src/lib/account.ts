import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { AccountType, CompanyRole } from "@/types/globals";

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
