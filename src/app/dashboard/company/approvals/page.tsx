import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
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
  const pendingTotal = pending.reduce((s, p) => s + p.totalLek, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-5">
      <div className="kicker text-coral">
        {pending.length === 0
          ? "All caught up"
          : `${pending.length} pending · ${toCoins(pendingTotal).toLocaleString("en-US")} coins to settle`}
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Approvals inbox</h1>
      <p className="mt-1 text-sm text-muted">
        {pending.length === 0
          ? "No packs waiting. You're all caught up."
          : "All within budget & tax-free unless flagged. One tap to fund."}
      </p>

      <div className="mt-6 space-y-4">
        {pendingWithItems.map(({ pkg, items }) => (
          <div key={pkg.id} className="card">
            <div className="flex items-center gap-3">
              <span className="avatar">{pkg.employee.displayName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-bold">{pkg.label}</h2>
                <p className="text-sm text-muted">for {pkg.employee.displayName}</p>
              </div>
              <span className="shrink-0 font-display text-lg font-bold text-lime-deep"><Coins amount={toCoins(pkg.totalLek)} /></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge badge-tax">Tax-free</span>
              <span className="pill pill-pending"><span className="dot" />Pending</span>
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
                <span className={`ico ${p.status === "APPROVED" ? "coral" : ""}`}>{p.status === "APPROVED" ? "✓" : "✕"}</span>
                <div className="grow">
                  <div className="t truncate">{p.label}</div>
                  <div className="s">{p.employee.displayName}</div>
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
