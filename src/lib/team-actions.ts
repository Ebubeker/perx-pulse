"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireMembership } from "./account";

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
  const pack = await prisma.teamPack.findFirst({ where: { id: teamPackId, companyId: m.companyId } });
  if (!pack) return { error: "Team pack not found." };
  try {
    await prisma.teamPackMember.create({ data: { teamPackId, employeeProfileId: m.id } });
  } catch {
    // already a member (unique) — treat as success
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
