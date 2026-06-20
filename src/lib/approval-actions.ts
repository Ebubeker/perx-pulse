"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireCompanyAdmin } from "./account";
import { splitFor, voucherCode } from "./payments";

/**
 * HR approves a pending package. This is the marketplace settlement:
 * the employer's budget is split across the providers behind each offer,
 * Perx records its take-rate, and the employee gets redemption codes.
 */
export async function approvePackage(packageId: string): Promise<void> {
  const m = await requireCompanyAdmin();

  const pkg = await prisma.perkPackage.findFirst({
    where: { id: packageId, companyId: m.companyId, status: "PENDING" },
  });
  if (!pkg) redirect("/dashboard/company/approvals");

  // Resolve the offers behind the pack to the providers that get paid.
  const offers = await prisma.offer.findMany({
    where: { id: { in: pkg.itemOfferIds } },
    include: { provider: { select: { id: true, takeRatePct: true } } },
  });
  const byId = new Map(offers.map((o) => [o.id, o] as const));

  const orderData = pkg.itemOfferIds
    .map((id) => byId.get(id))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .map((o) => {
      const { feeLek, netLek } = splitFor(o.priceLek, o.provider.takeRatePct);
      return {
        packageId: pkg.id,
        companyId: pkg.companyId,
        providerId: o.provider.id,
        offerId: o.id,
        employeeProfileId: pkg.employeeProfileId,
        title: o.title,
        grossLek: o.priceLek,
        takeRatePct: o.provider.takeRatePct,
        feeLek,
        netLek,
        code: voucherCode(),
      };
    });

  await prisma.$transaction([
    prisma.perkPackage.update({
      where: { id: pkg.id },
      data: { status: "APPROVED", decidedByClerkUserId: m.clerkUserId, decidedAt: new Date() },
    }),
    prisma.order.createMany({ data: orderData }),
  ]);

  revalidatePath("/dashboard/company/approvals");
  redirect(`/dashboard/company/approvals/${pkg.id}`);
}

/** HR declines a pending package. */
export async function rejectPackage(packageId: string): Promise<void> {
  const m = await requireCompanyAdmin();
  await prisma.perkPackage.updateMany({
    where: { id: packageId, companyId: m.companyId, status: "PENDING" },
    data: { status: "REJECTED", decidedByClerkUserId: m.clerkUserId, decidedAt: new Date() },
  });
  revalidatePath("/dashboard/company/approvals");
}

/** Provider marks a paid order as redeemed (employee showed up / used the voucher). */
export async function markRedeemed(orderId: string): Promise<void> {
  const { requireProvider } = await import("./account");
  const provider = await requireProvider();
  await prisma.order.updateMany({
    where: { id: orderId, providerId: provider.id, status: "PAID" },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });
  revalidatePath("/dashboard/provider");
}
