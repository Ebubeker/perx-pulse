import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { SettlementReveal } from "./SettlementReveal";

export const dynamic = "force-dynamic";

export default async function SettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await requireCompanyAdmin();

  const pkg = await prisma.perkPackage.findFirst({
    where: { id, companyId: m.companyId },
    include: { employee: { select: { displayName: true, perksBudgetLek: true } } },
  });
  if (!pkg) redirect("/dashboard/company/approvals");

  const budgetTotalLek = pkg.employee.perksBudgetLek;

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

  const budgetPct = budgetTotalLek ? Math.min(100, Math.round((gross / budgetTotalLek) * 100)) : 0;
  const remainingLek = Math.max(0, budgetTotalLek - gross);

  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <Link href="/dashboard/company/approvals" className="navlink inline-block text-sm font-semibold text-muted" style={{ paddingLeft: 0 }}>← Back to inbox</Link>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "10px 0 18px" }}>
        <Avatar name={pkg.employee.displayName} seed={pkg.employeeProfileId} size={52} />
        <div className="min-w-0">
          <h1 className="h1">{pkg.label}</h1>
          <div className="text-muted">{pkg.employee.displayName} · settled</div>
        </div>
        <span className="badge badge-tax" style={{ marginLeft: "auto" }}>TAX-FREE</span>
      </div>

      <div className="grid g-2">
        <div className="card">
          <h3 className="display" style={{ fontSize: 17, marginBottom: 6 }}>Breakdown</h3>
          {payouts.map((p) => (
            <div key={p.name} className="li">
              <span className="min-w-0 truncate">{p.name}</span>
              <b><Coins amount={toCoins(p.gross)} /></b>
            </div>
          ))}
          <div className="li" style={{ border: "none", fontSize: 18 }}>
            <b>Total</b>
            <b className="text-lime-deep"><Coins amount={toCoins(gross)} /></b>
          </div>
        </div>
        <div>
          <div className="ai" style={{ marginBottom: 14 }}>
            <span className="text-lime-deep shrink-0"><Icon name="sparkles" size={20} /></span>
            <div style={{ fontSize: 14 }}>
              <b>AI note for {pkg.employee.displayName}:</b> “Approved! Enjoy the reset — we&apos;ve settled it straight to your providers and kept it fully tax-free.”
            </div>
          </div>
          <SettlementReveal employer={gross} payouts={payouts} fee={fee} net={net} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="kicker">BUDGET IMPACT</div>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 20 }}>
            <Coins amount={toCoins(gross)} /> of {toCoins(budgetTotalLek).toLocaleString("en-US")} · leaves {toCoins(remainingLek).toLocaleString("en-US")}
          </div>
        </div>
        <div className="bar" style={{ flex: 1, minWidth: 160 }}><i style={{ width: `${budgetPct}%` }} /></div>
        <Link href="/dashboard/company/approvals" className="btn btn-soft">Back to inbox</Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Funds move from your budget straight to the providers. {pkg.employee.displayName} never touches the money — fully tax-free.
      </p>
    </main>
  );
}
