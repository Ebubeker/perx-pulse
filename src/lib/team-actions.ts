"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { effectiveLek, toCoins } from "./currency";

class JoinError extends Error {}

const TeamPackInput = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  targetSize: z.coerce.number().int().min(2).max(50),
  offerId: z.string().trim().max(40).optional().or(z.literal("")),
});

/** The group cashback each member earns when the pack fills — a perk you don't get buying solo. */
function computeBonus(targetSize: number, offerCoins: number | null): number {
  const base = offerCoins ? Math.round(offerCoins * 0.25) : targetSize * 3;
  return Math.min(150, Math.max(10, base));
}

/** An employee opens a group perk; the creator auto-joins. */
export async function createTeamPack(input: unknown): Promise<{ error?: string }> {
  const m = await requireMembership();
  const parsed = TeamPackInput.safeParse(input);
  if (!parsed.success) return { error: "Check the team pack details." };
  const d = parsed.data;

  let offerId: string | null = null;
  let offerCoins: number | null = null;
  if (d.offerId) {
    const offer = await prisma.offer.findFirst({ where: { id: d.offerId, active: true }, select: { id: true, priceLek: true, discountPct: true } });
    if (offer) {
      offerId = offer.id;
      offerCoins = toCoins(effectiveLek(offer.priceLek, offer.discountPct));
    }
  }
  const bonusCoins = computeBonus(d.targetSize, offerCoins);

  await prisma.teamPack.create({
    data: {
      companyId: m.companyId,
      createdByEmployeeId: m.id,
      title: d.title,
      description: d.description || null,
      targetSize: d.targetSize,
      offerId,
      bonusCoins,
      members: { create: { employeeProfileId: m.id } },
    },
  });
  revalidatePath("/dashboard/team");
  return {};
}

export async function joinTeamPack(teamPackId: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  try {
    await prisma.$transaction(async (tx) => {
      const pack = await tx.teamPack.findFirst({
        where: { id: teamPackId, companyId: m.companyId },
        select: { id: true, title: true, targetSize: true, bonusCoins: true, lockedAt: true, companyId: true },
      });
      if (!pack) throw new JoinError("NOT_FOUND");

      const already = await tx.teamPackMember.findUnique({ where: { teamPackId_employeeProfileId: { teamPackId, employeeProfileId: m.id } } });
      if (!already) {
        const count = await tx.teamPackMember.count({ where: { teamPackId } });
        if (count >= pack.targetSize) throw new JoinError("FULL");
        await tx.teamPackMember.create({ data: { teamPackId, employeeProfileId: m.id } });
      }

      // Did this join fill the group? Pay the group cashback to everyone — exactly once.
      const count = await tx.teamPackMember.count({ where: { teamPackId } });
      if (count >= pack.targetSize && !pack.lockedAt && pack.bonusCoins > 0) {
        const lock = await tx.teamPack.updateMany({ where: { id: teamPackId, lockedAt: null }, data: { lockedAt: new Date() } });
        if (lock.count === 1) {
          const members = await tx.teamPackMember.findMany({ where: { teamPackId }, select: { employeeProfileId: true } });
          for (const mem of members) {
            await tx.coinTxn.create({ data: { companyId: pack.companyId, kind: "GRANT", fromEmployeeId: null, toEmployeeId: mem.employeeProfileId, amount: pack.bonusCoins, memo: `Team perk bonus: ${pack.title}` } });
            await tx.employeeProfile.update({ where: { id: mem.employeeProfileId }, data: { recognitionCoins: { increment: pack.bonusCoins } } });
          }
        }
      }
    });
  } catch (e) {
    if (e instanceof JoinError) return { error: e.message === "FULL" ? "This team pack is already full." : "Team pack not found." };
    // unique violation = a concurrent join landed first — treat as success
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      console.error("[joinTeamPack]", e);
      return { error: "Could not join — try again." };
    }
  }
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/employee");
  revalidatePath("/dashboard/recognition");
  return {};
}

export async function leaveTeamPack(teamPackId: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  // Once the group has locked in (bonus already paid) you can't back out.
  const pack = await prisma.teamPack.findFirst({ where: { id: teamPackId, companyId: m.companyId }, select: { lockedAt: true } });
  if (pack?.lockedAt) return { error: "This group already locked in — you're in!" };
  await prisma.teamPackMember.deleteMany({ where: { teamPackId, employeeProfileId: m.id } });
  revalidatePath("/dashboard/team");
  return {};
}
