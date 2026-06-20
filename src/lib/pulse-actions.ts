"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BudgetMode } from "@prisma/client";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { recommendPackages } from "./gemini";

export async function runPulse(answers: Record<string, string>, budgetMode: BudgetMode): Promise<void> {
  const m = await requireMembership();

  const recs = await recommendPackages({
    answers,
    budgetMode,
    budgetLek: m.perksBudgetLek,
    personalization: {
      preferredCategories: m.preferredCategories,
      interests: m.interests,
      wellnessGoals: m.wellnessGoals,
      dietary: m.dietary,
      homeArea: m.homeArea,
    },
  });

  const pulse = await prisma.pulse.create({ data: { employeeProfileId: m.id, answers, budgetMode } });
  if (recs.length) {
    await prisma.recommendation.createMany({
      data: recs.map((r) => ({
        pulseId: pulse.id,
        employeeProfileId: m.id,
        label: r.label,
        rationale: r.rationale,
        itemOfferIds: r.itemOfferIds,
        totalLek: r.totalLek,
      })),
    });
  }

  revalidatePath("/dashboard/employee/discover");
  redirect("/dashboard/employee/discover");
}

export async function choosePackage(recId: string): Promise<void> {
  const m = await requireMembership();
  const rec = await prisma.recommendation.findFirst({ where: { id: recId, employeeProfileId: m.id } });
  if (!rec) redirect("/dashboard/employee/discover");

  const pkg = await prisma.perkPackage.create({
    data: {
      companyId: m.companyId,
      employeeProfileId: m.id,
      label: rec.label,
      rationale: rec.rationale,
      itemOfferIds: rec.itemOfferIds,
      totalLek: rec.totalLek,
      status: "DRAFT",
    },
  });
  redirect(`/dashboard/employee/package/${pkg.id}`);
}

export async function submitPackage(id: string): Promise<void> {
  const m = await requireMembership();
  await prisma.perkPackage.updateMany({
    where: { id, employeeProfileId: m.id, status: "DRAFT" },
    data: { status: "PENDING" },
  });
  revalidatePath(`/dashboard/employee/package/${id}`);
}

/** Swap one item in a draft pack for another active offer in the same category, within budget. */
export async function swapItem(packageId: string, offerId: string): Promise<void> {
  const m = await requireMembership();
  const pkg = await prisma.perkPackage.findFirst({ where: { id: packageId, employeeProfileId: m.id, status: "DRAFT" } });
  if (!pkg || !pkg.itemOfferIds.includes(offerId)) return;

  const current = await prisma.offer.findUnique({ where: { id: offerId }, select: { category: true } });
  if (!current) return;

  const packOffers = await prisma.offer.findMany({ where: { id: { in: pkg.itemOfferIds } }, select: { id: true, priceLek: true } });
  const baseTotal = packOffers.reduce((s, o) => s + o.priceLek, 0) - (packOffers.find((o) => o.id === offerId)?.priceLek ?? 0);

  const candidates = await prisma.offer.findMany({
    where: { active: true, category: current.category, id: { notIn: pkg.itemOfferIds } },
    orderBy: { priceLek: "asc" },
  });
  const replacement = candidates.find((o) => baseTotal + o.priceLek <= m.perksBudgetLek);
  if (!replacement) return;

  const newIds = pkg.itemOfferIds.map((id) => (id === offerId ? replacement.id : id));
  await prisma.perkPackage.update({
    where: { id: pkg.id },
    data: { itemOfferIds: newIds, totalLek: baseTotal + replacement.priceLek },
  });
  revalidatePath(`/dashboard/employee/package/${packageId}`);
}
