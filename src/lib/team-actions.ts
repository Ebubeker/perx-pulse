"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { requireMembership } from "./account";

class JoinError extends Error {}

const TeamPackInput = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  targetSize: z.coerce.number().int().min(2).max(50),
});

/** An employee opens a group activity; the creator auto-joins. */
export async function createTeamPack(input: unknown): Promise<{ error?: string }> {
  const m = await requireMembership();
  const parsed = TeamPackInput.safeParse(input);
  if (!parsed.success) return { error: "Check the team pack details." };
  const d = parsed.data;

  await prisma.teamPack.create({
    data: {
      companyId: m.companyId,
      createdByEmployeeId: m.id,
      title: d.title,
      description: d.description || null,
      targetSize: d.targetSize,
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
        select: { targetSize: true, _count: { select: { members: true } } },
      });
      if (!pack) throw new JoinError("NOT_FOUND");
      const already = await tx.teamPackMember.findUnique({
        where: { teamPackId_employeeProfileId: { teamPackId, employeeProfileId: m.id } },
      });
      if (already) return; // idempotent — already a member
      if (pack._count.members >= pack.targetSize) throw new JoinError("FULL");
      await tx.teamPackMember.create({ data: { teamPackId, employeeProfileId: m.id } });
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
  return {};
}

export async function leaveTeamPack(teamPackId: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  await prisma.teamPackMember.deleteMany({ where: { teamPackId, employeeProfileId: m.id } });
  revalidatePath("/dashboard/team");
  return {};
}
