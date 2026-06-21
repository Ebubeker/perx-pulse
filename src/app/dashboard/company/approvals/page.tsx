import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Avatar } from "@/components/Avatar";
import { ApprovalActions } from "./ApprovalActions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const m = await requireCompanyAdmin();

  const [pending, decided] = await Promise.all([
    prisma.perkPackage.findMany({
      where: { companyId: m.companyId, status: "PENDING" },
      include: { employee: { select: { displayName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.perkPackage.findMany({
      where: { companyId: m.companyId, status: { in: ["APPROVED", "REJECTED"] } },
      include: { employee: { select: { displayName: true } } },
      orderBy: { decidedAt: "desc" },
      take: 8,
    }),
  ]);

  const pendingWithItems = await Promise.all(
    pending.map(async (p) => ({ pkg: p, items: await resolveOffers(p.itemOfferIds) })),
  );

  return (
    <main className="page" style={{ maxWidth: 920 }}>
      <h1 className="h1" style={{ marginBottom: 6 }}>Approvals inbox</h1>
      <p className="text-muted">{pending.length === 0 ? "All caught up" : `${pending.length} pending`}</p>

      <div style={{ marginTop: 16 }}>
        {pendingWithItems.map(({ pkg, items }) => (
          <div key={pkg.id} className="appr">
            <Avatar name={pkg.employee.displayName} seed={pkg.employeeProfileId} size={46} />
            <Link href={`/dashboard/company/approvals/${pkg.id}`} className="who" style={{ color: "inherit" }}>
              <div className="t">{pkg.employee.displayName} · {pkg.label}</div>
              <div className="s">{items.map((o) => o.providerName).join(" · ") || "Perx pack"}</div>
            </Link>
            <div className="tot text-lime-deep"><Coins amount={toCoins(pkg.totalLek)} /></div>
            <div className="actions">
              <ApprovalActions packageId={pkg.id} />
            </div>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <>
          <div className="sec"><h3>Recent decisions</h3></div>
          <div>
            {decided.map((p) => (
              <div key={p.id} className="row">
                <Avatar name={p.employee.displayName} seed={p.employeeProfileId} size={42} />
                <div className="grow">
                  <div className="t truncate">{p.label}</div>
                  <div className="s">{p.employee.displayName} · <Coins amount={toCoins(p.totalLek)} /></div>
                </div>
                {p.status === "APPROVED" ? (
                  <Link href={`/dashboard/company/approvals/${p.id}`} className="pill pill-approved shrink-0">
                    <span className="dot" />Settled →
                  </Link>
                ) : (
                  <span className="pill pill-redeemed shrink-0"><span className="dot" />Declined</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
