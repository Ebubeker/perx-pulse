import Link from "next/link";
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
    <main className="mx-auto max-w-md px-4 py-5">
      <Link href="/dashboard/company/approvals" className="sec link mb-0 mt-0 inline-block text-sm text-muted">← Back to inbox</Link>
      <div className="mt-2 flex items-center gap-3">
        <span className="avatar size-12 text-lg">{pkg.employee.displayName.charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <div className="kicker text-lime-deep">Settled</div>
          <h1 className="truncate font-display text-2xl font-bold tracking-tight">{pkg.label}</h1>
          <p className="text-sm text-muted">Paid out for {pkg.employee.displayName}</p>
        </div>
        <span className="badge badge-tax ml-auto shrink-0">Tax-free</span>
      </div>

      <SettlementReveal employer={gross} payouts={payouts} fee={fee} net={net} />

      <p className="mt-6 text-center text-xs text-muted">
        Funds move from your budget straight to the providers. {pkg.employee.displayName} never touches the money — fully tax-free.
      </p>
    </main>
  );
}
