import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mt-1 text-2xl font-bold">Approvals</h1>
      <p className="mt-1 text-sm text-muted">
        {pending.length === 0
          ? "No packs waiting. You're all caught up."
          : `${pending.length} pack${pending.length > 1 ? "s" : ""} waiting · ${pendingTotal.toLocaleString("en-US")} L to settle`}
      </p>

      <div className="mt-6 space-y-4">
        {pendingWithItems.map(({ pkg, items }) => (
          <div key={pkg.id} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{pkg.label}</h2>
                <p className="text-sm text-muted">for {pkg.employee.displayName}</p>
              </div>
              <span className="shrink-0 font-bold">{pkg.totalLek.toLocaleString("en-US")} L</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {items.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{o.title}</span>{" "}
                    <span className="text-muted">· {o.providerName}</span>
                  </span>
                  <span className="shrink-0 text-ink-soft">{o.priceLek.toLocaleString("en-US")} L</span>
                </li>
              ))}
            </ul>
            <ApprovalActions packageId={pkg.id} />
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-muted">Recent decisions</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
            {decided.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{p.label}</span>{" "}
                  <span className="text-muted">· {p.employee.displayName}</span>
                </span>
                {p.status === "APPROVED" ? (
                  <Link href={`/dashboard/company/approvals/${p.id}`} className="shrink-0 font-semibold text-primary">
                    ✓ settled →
                  </Link>
                ) : (
                  <span className="shrink-0 text-muted">declined</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
