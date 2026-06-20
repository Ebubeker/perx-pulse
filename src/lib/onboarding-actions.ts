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

const optEmail = z.string().trim().max(254).email("Enter a valid email").optional().or(z.literal(""));

const CompanyInput = z.object({
  name: z.string().trim().min(2, "Company name is required").max(120),
  brandName: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(80).optional(),
  sizeBucket: z.string().trim().max(40).optional(),
  website: z.string().trim().max(2048).optional(),
  nipt: z.string().trim().max(20).optional(),
  vatRegistered: z.boolean().optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  defaultBudgetLek: z.coerce.number().int().min(0).max(10_000_000).optional(),
  billingContactName: z.string().trim().max(120).optional(),
  billingContactEmail: optEmail,
  departments: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  adminName: z.string().trim().min(1, "Your name is required").max(80),
  adminTitle: z.string().trim().max(80).optional(),
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

  // An empty budget field coerces to 0 (Number("")===0), which is not nullish — so a blank
  // input would set a 0-Lek company. Treat any non-positive value as "use the default".
  const budget = data.defaultBudgetLek && data.defaultBudgetLek > 0 ? data.defaultBudgetLek : 12000;
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
            // The owner must keep admin access. HR also has it; anything else (e.g. FINANCE)
            // would lock the sole member out of company-admin surfaces, so clamp to ADMIN.
            role: data.adminRole === "HR" ? "HR" : "ADMIN",
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

const ProviderInput = z
  .object({
    businessName: z.string().trim().min(2, "Business name is required").max(120),
    category: z.enum(["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"]),
    description: z.string().trim().max(2000).optional(),
    addressLine: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    areasServed: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    contactName: z.string().trim().max(120).optional(),
    contactEmail: optEmail,
    contactPhone: z.string().trim().max(30).optional(),
    nipt: z.string().trim().max(20).optional(),
    vatRegistered: z.boolean().optional(),
    settlementMethod: z.enum(["BANK", "PERXCOIN"]).optional(),
    bankIban: z.string().trim().max(34).optional(),
  })
  .refine((d) => d.settlementMethod !== "BANK" || !!d.bankIban?.trim(), {
    message: "An IBAN is required for bank settlement",
    path: ["bankIban"],
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

const chips = z.array(z.string().trim().min(1).max(40)).max(20).optional();

const EmployeeInput = z.object({
  displayName: z.string().trim().min(1, "Your name is required").max(80),
  jobTitle: z.string().trim().max(80).optional(),
  workArea: z.string().trim().max(80).optional(),
  homeArea: z.string().trim().max(80).optional(),
  preferredCategories: chips,
  interests: chips,
  wellnessGoals: chips,
  dietary: chips,
  languages: chips,
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

  // The invite was sent to a specific email — the signed-in user must own a VERIFIED copy of it
  // (an unverified address must not be enough to claim a seat).
  const target = invitation.email.toLowerCase();
  const ownsVerified = user.emailAddresses.some(
    (e) => e.verification?.status === "verified" && e.emailAddress.toLowerCase() === target,
  );
  if (!ownsVerified) {
    return { error: "Sign in with the verified email this invitation was sent to." };
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
