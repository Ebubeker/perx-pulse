"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import type { AccountType } from "@/types/globals";

export type ActionResult = { error: string } | void;

// Thrown inside the employee transaction when the invitation is no longer claimable.
class InviteUnavailable extends Error {}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "x"
  );
}

async function uniqueSlug(base: string, kind: "company" | "provider"): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  for (let i = 0; i < 50; i++) {
    const taken =
      kind === "company"
        ? await prisma.company.findUnique({ where: { slug }, select: { id: true } })
        : await prisma.provider.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
    slug = `${root}-${++n}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// An invited user must complete EMPLOYEE onboarding — they can't self-onboard as a
// company or provider. Enforced at the ACTION layer (the real boundary), not just pages.
async function blockIfInvited(): Promise<void> {
  const user = await currentUser();
  if (user && typeof user.publicMetadata.invitedToCompanyId === "string") redirect("/onboarding/employee");
}

export async function chooseAccountType(type: AccountType): Promise<void> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await blockIfInvited();
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { publicMetadata: { accountType: type } });
  redirect(`/onboarding/${type}`);
}

const CompanyInput = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  brandName: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  sizeBucket: z.string().trim().optional(),
  website: z.string().trim().optional(),
  nipt: z.string().trim().optional(),
  vatRegistered: z.boolean().optional(),
  addressLine: z.string().trim().optional(),
  city: z.string().trim().optional(),
  defaultBudgetLek: z.coerce.number().int().min(0).max(10_000_000).optional(),
  billingContactName: z.string().trim().optional(),
  billingContactEmail: z.string().trim().optional(),
  departments: z.array(z.string().trim()).optional(),
  adminName: z.string().trim().min(1, "Your name is required"),
  adminTitle: z.string().trim().optional(),
  adminRole: z.enum(["ADMIN", "HR", "FINANCE"]).optional(),
});

export async function setupCompany(input: unknown): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await blockIfInvited();

  const existing = await prisma.employeeProfile.findFirst({ where: { clerkUserId: userId }, select: { id: true } });
  if (existing) redirect("/dashboard");

  const parsed = CompanyInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const data = parsed.data;

  const budget = data.defaultBudgetLek ?? 12000;
  const slug = await uniqueSlug(data.brandName || data.name, "company");
  const departments = (data.departments ?? []).map((s) => s.trim()).filter(Boolean);

  try {
    await prisma.company.create({
      data: {
        ownerClerkUserId: userId,
        name: data.name,
        brandName: data.brandName || null,
        slug,
        industry: data.industry || null,
        sizeBucket: data.sizeBucket || null,
        website: data.website || null,
        nipt: data.nipt || null,
        vatRegistered: data.vatRegistered ?? false,
        addressLine: data.addressLine || null,
        city: data.city || null,
        defaultBudgetLek: budget,
        billingContactName: data.billingContactName || null,
        billingContactEmail: data.billingContactEmail || null,
        onboardingComplete: true,
        departments: departments.length ? { create: departments.map((name) => ({ name })) } : undefined,
        members: {
          create: {
            clerkUserId: userId,
            role: data.adminRole ?? "ADMIN",
            displayName: data.adminName,
            jobTitle: data.adminTitle || null,
            perksBudgetLek: budget,
            onboardingComplete: true,
          },
        },
      },
    });
  } catch (e) {
    // Unique owner constraint → a concurrent submit already created the company.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") redirect("/dashboard");
    console.error("[setupCompany]", e);
    return { error: "We couldn't save your company. Please try again." };
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { accountType: "company", onboardingComplete: true },
  });

  redirect("/dashboard");
}

const ProviderInput = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  category: z.enum(["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"]),
  description: z.string().trim().optional(),
  addressLine: z.string().trim().optional(),
  city: z.string().trim().optional(),
  areasServed: z.array(z.string().trim()).optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  nipt: z.string().trim().optional(),
  vatRegistered: z.boolean().optional(),
  settlementMethod: z.enum(["BANK", "PERXCOIN"]).optional(),
  bankIban: z.string().trim().optional(),
});

export async function setupProvider(input: unknown): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await blockIfInvited();

  const parsed = ProviderInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const data = parsed.data;

  const areas = (data.areasServed ?? []).map((s) => s.trim()).filter(Boolean);
  const slug = await uniqueSlug(data.businessName, "provider");

  const fields = {
    businessName: data.businessName,
    category: data.category,
    description: data.description || null,
    addressLine: data.addressLine || null,
    city: data.city || null,
    areasServed: areas,
    contactName: data.contactName || null,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    nipt: data.nipt || null,
    vatRegistered: data.vatRegistered ?? false,
    settlementMethod: data.settlementMethod ?? ("BANK" as const),
    bankIban: data.bankIban || null,
    onboardingComplete: true,
  };

  try {
    await prisma.provider.upsert({
      where: { clerkUserId: userId },
      update: fields,
      create: { clerkUserId: userId, slug, ...fields },
    });
  } catch (e) {
    console.error("[setupProvider]", e);
    return { error: "We couldn't save your profile. Please try again." };
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { accountType: "provider", onboardingComplete: true },
  });

  redirect("/dashboard");
}

const EmployeeInput = z.object({
  displayName: z.string().trim().min(1, "Your name is required"),
  jobTitle: z.string().trim().optional(),
  workArea: z.string().trim().optional(),
  homeArea: z.string().trim().optional(),
  preferredCategories: z.array(z.string().trim()).optional(),
  interests: z.array(z.string().trim()).optional(),
  wellnessGoals: z.array(z.string().trim()).optional(),
  dietary: z.array(z.string().trim()).optional(),
  languages: z.array(z.string().trim()).optional(),
});

export async function completeEmployeeOnboarding(input: unknown): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const companyId = typeof user.publicMetadata.invitedToCompanyId === "string" ? user.publicMetadata.invitedToCompanyId : null;
  const invitationId = typeof user.publicMetadata.invitationId === "string" ? user.publicMetadata.invitationId : null;
  if (!companyId || !invitationId) redirect("/onboarding");

  const parsed = EmployeeInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const data = parsed.data;

  // The Invitation row is the source of truth — it must still be PENDING and scoped to
  // this company. Role + department are taken from it, NOT from (mutable) metadata.
  const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, companyId, status: "PENDING" } });
  if (!invitation) redirect("/onboarding"); // revoked, already used, or unknown

  // The invite was sent to a specific email — the signed-in user must own it.
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  if (!email || email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "This invitation was sent to a different email address." };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) redirect("/onboarding");

  const existing = await prisma.employeeProfile.findUnique({
    where: { clerkUserId_companyId: { clerkUserId: user.id, companyId } },
    select: { id: true },
  });
  if (existing) redirect("/dashboard");

  try {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the invitation (defeats double-accept / revoke races).
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });
      if (claimed.count === 0) throw new InviteUnavailable();

      await tx.employeeProfile.create({
        data: {
          clerkUserId: user.id,
          companyId,
          departmentId: invitation.departmentId,
          role: invitation.role,
          displayName: data.displayName,
          jobTitle: data.jobTitle || null,
          workArea: data.workArea || null,
          homeArea: data.homeArea || null,
          perksBudgetLek: company.defaultBudgetLek,
          preferredCategories: data.preferredCategories ?? [],
          interests: data.interests ?? [],
          wellnessGoals: data.wellnessGoals ?? [],
          dietary: data.dietary ?? [],
          languages: data.languages ?? [],
          onboardingComplete: true,
        },
      });
    });
  } catch (e) {
    if (e instanceof InviteUnavailable) redirect("/onboarding");
    console.error("[completeEmployeeOnboarding]", e);
    return { error: "We couldn't complete your setup. Please try again." };
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: { accountType: "company", onboardingComplete: true },
  });

  redirect("/dashboard");
}
