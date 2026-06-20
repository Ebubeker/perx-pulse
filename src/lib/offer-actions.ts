"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireProvider } from "./account";

export type OfferResult = { error: string } | { ok: true };

const CATEGORIES = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"] as const;

const OfferInput = z.object({
  title: z.string().trim().min(2, "Title is required").max(80),
  description: z.string().trim().max(600).optional(),
  category: z.enum(CATEGORIES).optional(),
  priceLek: z.coerce.number().int().min(0).max(10_000_000),
  discountPct: z.coerce.number().int().min(0).max(90).optional(),
  area: z.string().trim().max(60).optional(),
  taxFree: z.boolean().optional(),
});

export async function createOffer(input: unknown): Promise<OfferResult> {
  const provider = await requireProvider();
  const parsed = OfferInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the offer details." };
  const d = parsed.data;

  try {
    await prisma.offer.create({
      data: {
        providerId: provider.id,
        title: d.title,
        description: d.description || null,
        category: d.category ?? provider.category,
        priceLek: d.priceLek,
        discountPct: d.discountPct ?? 0,
        area: d.area || provider.city || null,
        taxFree: d.taxFree ?? false,
        active: true,
      },
    });
  } catch (e) {
    console.error("[createOffer]", e);
    return { error: "Could not save the offer. Please try again." };
  }

  revalidatePath("/dashboard/provider");
  return { ok: true };
}

// Scoped to the provider's own offers — no cross-tenant writes.
export async function setOfferActive(offerId: string, active: boolean): Promise<void> {
  const provider = await requireProvider();
  await prisma.offer.updateMany({ where: { id: offerId, providerId: provider.id }, data: { active } });
  revalidatePath("/dashboard/provider");
}

export async function deleteOffer(offerId: string): Promise<void> {
  const provider = await requireProvider();
  await prisma.offer.deleteMany({ where: { id: offerId, providerId: provider.id } });
  revalidatePath("/dashboard/provider");
}
