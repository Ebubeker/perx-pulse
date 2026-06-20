import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Avatar } from "@/components/Avatar";
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
    <main className="page" style={{ maxWidth: 760 }}>
      <Link href="/dashboard/company/approvals" className="navlink inline-block pl-0 text-sm text-muted">← Back to inbox</Link>

      <div className="my-3 flex items-center gap-3.5">
        <Avatar name={pkg.employee.displayName} seed={pkg.employeeProfileId} size={52} />
        <div className="min-w-0">
          <div className="kicker text-lime-deep">Settled</div>
          <h1 className="truncate font-display text-3xl font-extrabold tracking-tight">{pkg.label}</h1>
          <p className="text-muted">Paid out for {pkg.employee.displayName}</p>
        </div>
        <span className="badge badge-tax ml-auto shrink-0">Tax-free</span>
      </div>

      <div className="grid g-2 items-start">
        <div className="card">
          <h3 className="display mb-2 font-display text-lg font-bold">Breakdown</h3>
          {payouts.map((p) => (
            <div key={p.name} className="flex items-center justify-between border-b border-line py-3">
              <span className="min-w-0 truncate">{p.name}</span>
              <b className="shrink-0 font-bold"><Coins amount={toCoins(p.gross)} /></b>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-lg">
            <b>Total</b>
            <b className="text-lime-deep"><Coins amount={toCoins(gross)} /></b>
          </div>
        </div>

        <SettlementReveal employer={gross} payouts={payouts} fee={fee} net={net} />
      </div>

      <div className="card mt-4 flex flex-wrap items-center gap-4">
        <div>
          <div className="kicker">Settlement</div>
          <div className="font-display text-xl font-extrabold">
            <Coins amount={toCoins(gross)} /> spent · {net.toLocaleString("en-US")} L to providers · {fee.toLocaleString("en-US")} L to Perx
          </div>
        </div>
        <Link href="/dashboard/company/approvals" className="btn btn-soft ml-auto">Back to inbox</Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Funds move from your budget straight to the providers. {pkg.employee.displayName} never touches the money — fully tax-free.
      </p>
    </main>
  );
}
