"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireCompanyAdmin } from "./account";

export type InviteResult = { error: string } | { ok: true };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const InviteInput = z.object({
  email: z.string().trim().toLowerCase().max(254).refine((v) => EMAIL_RE.test(v), "Enter a valid email"),
  departmentId: z.string().trim().max(40).optional(),
  role: z.enum(["EMPLOYEE", "HR", "FINANCE"]).optional(),
});

export async function inviteEmployee(input: unknown): Promise<InviteResult> {
  // Authorization: only an ADMIN/HR of a company, scoped to THEIR company.
  const admin = await requireCompanyAdmin();

  const parsed = InviteInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, departmentId, role } = parsed.data;

  // Department must belong to the admin's own company (no cross-tenant references).
  let deptId: string | null = null;
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, companyId: admin.companyId },
      select: { id: true },
    });
    deptId = dept?.id ?? null;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  // Don't accumulate duplicate PENDING invites for the same email — supersede any prior one
  // so the new role/department wins and the people list stays clean.
  await prisma.invitation.updateMany({
    where: { companyId: admin.companyId, email, status: "PENDING" },
    data: { status: "REVOKED" },
  });

  // We need the DB row id to embed in the invite metadata, so create it first — but if
  // the external Clerk call then fails, delete the row so it can't linger as a phantom invite.
  const invitation = await prisma.invitation.create({
    data: { companyId: admin.companyId, email, departmentId: deptId, role: role ?? "EMPLOYEE", status: "PENDING" },
  });

  try {
    const client = await clerkClient();
    const clerkInv = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { invitedToCompanyId: admin.companyId, invitedRole: role ?? "EMPLOYEE", invitationId: invitation.id },
      redirectUrl: `${appUrl}/sign-up`,
      notify: true,
      ignoreExisting: true,
    });

    await prisma.invitation.update({ where: { id: invitation.id }, data: { clerkInvitationId: clerkInv.id } });
  } catch (e) {
    await prisma.invitation.delete({ where: { id: invitation.id } }).catch(() => {});
    console.error("[inviteEmployee]", e);
    return { error: "Could not send the invite — this email may already be invited or registered." };
  }

  revalidatePath("/dashboard/company/people");
  return { ok: true };
}

export async function revokeInvitation(invitationId: string): Promise<InviteResult> {
  const admin = await requireCompanyAdmin();
  const inv = await prisma.invitation.findFirst({
    where: { id: invitationId, companyId: admin.companyId },
  });
  if (!inv) return { error: "Invitation not found." };

  try {
    if (inv.clerkInvitationId) {
      const client = await clerkClient();
      await client.invitations.revokeInvitation(inv.clerkInvitationId);
    }
    await prisma.invitation.update({ where: { id: inv.id }, data: { status: "REVOKED" } });
  } catch (e) {
    console.error("[revokeInvitation]", e);
    return { error: "Could not revoke the invitation." };
  }

  revalidatePath("/dashboard/company/people");
  return { ok: true };
}
