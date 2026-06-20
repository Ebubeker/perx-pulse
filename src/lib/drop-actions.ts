"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type OfferCategory } from "@prisma/client";
import { prisma } from "./prisma";
import { requireProvider, requireMembership } from "./account";
import { voucherCode } from "./payments";

class ClaimError extends Error {}

const CATEGORIES = ["wellness", "fitness", "food", "health", "travel", "learning", "culture", "telecom"] as const;

const DropInput = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.enum(CATEGORIES),
  area: z.string().trim().max(60).optional().or(z.literal("")),
  costCoins: z.coerce.number().int().min(1).max(5000),
  totalSlots: z.coerce.number().int().min(1).max(500),
  hours: z.coerce.number().int().min(1).max(336), // up to 14 days
});

/** Provider posts a limited-time coin-priced flash perk. */
export async function createDrop(input: unknown): Promise<{ error?: string }> {
  const p = await requireProvider();
  const parsed = DropInput.safeParse(input);
  if (!parsed.success) return { error: "Check the drop details." };
  const d = parsed.data;

  await prisma.drop.create({
    data: {
      providerId: p.id,
      title: d.title,
      description: d.description || null,
      category: d.category as OfferCategory,
      area: d.area || null,
      costCoins: d.costCoins,
      totalSlots: d.totalSlots,
      endsAt: new Date(Date.now() + d.hours * 3_600_000),
    },
  });
  revalidatePath("/dashboard/provider/drops");
  return {};
}

export async function setDropActive(dropId: string, active: boolean): Promise<void> {
  const p = await requireProvider();
  await prisma.drop.updateMany({ where: { id: dropId, providerId: p.id }, data: { active } });
  revalidatePath("/dashboard/provider/drops");
}

/**
 * Employee claims a drop with PerxCoin. Fully atomic: the slot count and the coin balance
 * are guarded by conditional SQL writes inside one transaction, so concurrent claims can
 * neither oversell the slots nor drive a wallet negative.
 */
export async function claimDrop(dropId: string): Promise<{ error?: string; code?: string }> {
  const m = await requireMembership();

  // Fast pre-checks for friendly messages; the writes below are the real guards.
  const drop = await prisma.drop.findUnique({ where: { id: dropId } });
  if (!drop || !drop.active || drop.endsAt <= new Date()) return { error: "This drop is no longer available." };
  if (drop.claimedSlots >= drop.totalSlots) return { error: "All slots are gone." };
  if (m.recognitionCoins < drop.costCoins) return { error: `You need ${drop.costCoins} coins — you have ${m.recognitionCoins}.` };

  const code = voucherCode();
  try {
    await prisma.$transaction(async (tx) => {
      // Atomic slot claim (column-to-column guard requires raw SQL).
      const slot = await tx.$executeRaw`UPDATE "perx"."Drop" SET "claimedSlots" = "claimedSlots" + 1
        WHERE "id" = ${dropId} AND "active" = true AND "endsAt" > now() AND "claimedSlots" < "totalSlots"`;
      if (slot === 0) throw new ClaimError("SOLD_OUT");

      // One claim per person — the unique [dropId, employeeProfileId] index enforces it.
      await tx.dropClaim.create({ data: { dropId, employeeProfileId: m.id, code } });

      // Atomic coin debit — only succeeds if the wallet can cover it.
      const debit = await tx.$executeRaw`UPDATE "perx"."EmployeeProfile" SET "recognitionCoins" = "recognitionCoins" - ${drop.costCoins}
        WHERE "id" = ${m.id} AND "recognitionCoins" >= ${drop.costCoins}`;
      if (debit === 0) throw new ClaimError("NO_FUNDS");

      await tx.coinTxn.create({
        data: { companyId: m.companyId, kind: "SPEND", fromEmployeeId: m.id, toEmployeeId: null, amount: drop.costCoins, memo: `Claimed: ${drop.title}` },
      });
    });
  } catch (e) {
    if (e instanceof ClaimError) return { error: e.message === "SOLD_OUT" ? "All slots are gone." : "You don't have enough coins." };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "You already claimed this drop." };
    console.error("[claimDrop]", e);
    return { error: "Could not claim — try again." };
  }
  revalidatePath("/dashboard/employee/drops");
  return { code };
}
