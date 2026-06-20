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

  const [pending, decided, newToday] = await Promise.all([
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
    prisma.perkPackage.count({
      where: {
        companyId: m.companyId,
        status: "PENDING",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const pendingWithItems = await Promise.all(
    pending.map(async (p) => ({ pkg: p, items: await resolveOffers(p.itemOfferIds) })),
  );
  const pendingTotal = pending.reduce((s, p) => s + p.totalLek, 0);

  return (
    <main className="page" style={{ maxWidth: 920 }}>
      <div className="kicker text-coral">
        {pending.length === 0
          ? "All caught up"
          : `${pending.length} pending · ${newToday} new today`}
      </div>
      <h1 className="mb-1.5 mt-1 font-display text-4xl font-extrabold tracking-tight">Approvals inbox</h1>
      <p className="text-muted">
        {pending.length === 0
          ? "No packs waiting. You're all caught up."
          : "All within budget & tax-free unless flagged. One tap to fund."}
      </p>
      {pending.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <Coins amount={toCoins(pendingTotal)} className="font-semibold text-ink-soft" /> waiting to settle across {pending.length} pack{pending.length === 1 ? "" : "s"}.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {pendingWithItems.map(({ pkg, items }) => (
          <div key={pkg.id} className="card">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={pkg.employee.displayName} seed={pkg.employeeProfileId} size={46} />
              <div className="min-w-[170px] flex-1">
                <div className="font-bold">{pkg.employee.displayName} · {pkg.label}</div>
                <div className="truncate text-sm text-muted">
                  {items.map((o) => o.providerName).join(" · ") || "Perx pack"}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="badge badge-tax">Tax-free</span>
                <span className="pill pill-ready"><span className="dot" />In budget</span>
              </div>
              <div className="font-display text-xl font-extrabold text-lime-deep">
                <Coins amount={toCoins(pkg.totalLek)} />
              </div>
            </div>

            <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
              {items.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{o.title}</span>{" "}
                    <span className="text-muted">· {o.providerName}</span>
                  </span>
                  <span className="shrink-0 text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
              <Link href={`/dashboard/company/approvals/${pkg.id}`} className="link text-sm">View payment split →</Link>
            </div>
            <ApprovalActions packageId={pkg.id} />
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
