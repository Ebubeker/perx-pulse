import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { SettlementReveal } from "./SettlementReveal";

export const dynamic = "force-dynamic";

export default async function SettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await requireCompanyAdmin();

  const pkg = await prisma.perkPackage.findFirst({
    where: { id, companyId: m.companyId },
    include: { employee: { select: { displayName: true } } },
  });
  if (!pkg) redirect("/dashboard/company/approvals");

  const orders = await prisma.order.findMany({
    where: { packageId: pkg.id },
    include: { provider: { select: { businessName: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Group the split by provider — each provider is one payout.
  const byProvider = new Map<string, { name: string; gross: number; fee: number; net: number }>();
  for (const o of orders) {
    const cur = byProvider.get(o.providerId) ?? { name: o.provider.businessName, gross: 0, fee: 0, net: 0 };
    cur.gross += o.grossLek;
    cur.fee += o.feeLek;
    cur.net += o.netLek;
    byProvider.set(o.providerId, cur);
  }
  const payouts = [...byProvider.values()];
  const gross = payouts.reduce((s, p) => s + p.gross, 0);
  const fee = payouts.reduce((s, p) => s + p.fee, 0);
  const net = payouts.reduce((s, p) => s + p.net, 0);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="mt-1 text-sm font-semibold tracking-wide text-primary">SETTLED</p>
      <h1 className="text-2xl font-bold">{pkg.label}</h1>
      <p className="mt-1 text-sm text-muted">Paid out for {pkg.employee.displayName}</p>

      <SettlementReveal employer={gross} payouts={payouts} fee={fee} net={net} />

      <p className="mt-6 text-center text-xs text-muted">
        Funds move from your budget straight to the providers. {pkg.employee.displayName} never touches the money — fully tax-free.
      </p>
    </main>
  );
}
