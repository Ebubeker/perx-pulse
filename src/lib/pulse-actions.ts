"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BudgetMode } from "@prisma/client";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { recommendPackages } from "./gemini";
import { refreshEmployeeProfile } from "./ai-profile";
import { effectiveLek, toLek } from "./currency";

// Tap-only Pulse: a small bounded map of chip answers + a known budget mode. These feed an AI
// prompt and the DB, so they must be validated server-side (never trust the client).
const PulseAnswers = z.record(z.string().trim().max(40), z.string().trim().max(60)).refine(
  (a) => Object.keys(a).length <= 12,
  "Too many answers.",
);

export async function runPulse(answers: unknown, budgetMode: unknown): Promise<void> {
  const m = await requireMembership();

  const parsedAnswers = PulseAnswers.safeParse(answers);
  const parsedMode = z.nativeEnum(BudgetMode).safeParse(budgetMode);
  if (!parsedAnswers.success || !parsedMode.success) redirect("/dashboard/employee/pulse");
  const safeAnswers = parsedAnswers.data;
  const mode = parsedMode.data;

  const recs = await recommendPackages({
    answers: safeAnswers,
    budgetMode: mode,
    budgetLek: m.perksBudgetLek,
    personalization: {
      preferredCategories: m.preferredCategories,
      interests: m.interests,
      wellnessGoals: m.wellnessGoals,
      dietary: m.dietary,
      homeArea: m.homeArea,
    },
    aiProfile: m.aiProfile,
  });

  const pulse = await prisma.pulse.create({ data: { employeeProfileId: m.id, answers: safeAnswers, budgetMode: mode } });
  // This check-in is fresh signal — fold it into Perx's saved memory of the employee.
  await refreshEmployeeProfile(m.id);
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

/** Employee hand-picks offers from the full catalog → a draft pack they can submit to HR. */
export async function requestOffers(offerIds: string[]): Promise<void> {
  const m = await requireMembership();
  const ids = [...new Set((Array.isArray(offerIds) ? offerIds : []).filter((x): x is string => typeof x === "string"))].slice(0, 8);
  if (!ids.length) redirect("/dashboard/employee");

  const offers = await prisma.offer.findMany({ where: { id: { in: ids }, active: true } });
  if (!offers.length) redirect("/dashboard/employee");
  const byId = new Map(offers.map((o) => [o.id, o] as const));
  const ordered = ids.map((id) => byId.get(id)).filter((o): o is NonNullable<typeof o> => !!o);
  const total = ordered.reduce((s, o) => s + effectiveLek(o.priceLek, o.discountPct), 0);

  const pkg = await prisma.perkPackage.create({
    data: {
      companyId: m.companyId,
      employeeProfileId: m.id,
      label: ordered.length === 1 ? ordered[0]!.title : "My picks",
      rationale: "Hand-picked from the marketplace.",
      itemOfferIds: ordered.map((o) => o.id),
      totalLek: total,
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

  const packOffers = await prisma.offer.findMany({ where: { id: { in: pkg.itemOfferIds } }, select: { id: true, priceLek: true, discountPct: true } });
  const eff = (o: { priceLek: number; discountPct: number }) => effectiveLek(o.priceLek, o.discountPct);
  const baseTotal = packOffers.reduce((s, o) => s + eff(o), 0) - (packOffers.find((o) => o.id === offerId) ? eff(packOffers.find((o) => o.id === offerId)!) : 0);

  const candidates = await prisma.offer.findMany({
    where: { active: true, category: current.category, id: { notIn: pkg.itemOfferIds } },
    orderBy: { priceLek: "asc" },
  });
  const cap = toLek(m.recognitionCoins); // can't assemble a pack beyond your coin wallet
  const replacement = candidates.find((o) => baseTotal + eff(o) <= cap);
  if (!replacement) return;

  const newIds = pkg.itemOfferIds.map((id) => (id === offerId ? replacement.id : id));
  await prisma.perkPackage.update({
    where: { id: pkg.id },
    data: { itemOfferIds: newIds, totalLek: baseTotal + eff(replacement) },
  });
  revalidatePath(`/dashboard/employee/package/${packageId}`);
}
