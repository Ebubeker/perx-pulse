import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const [orders, claims, pending] = await Promise.all([
    prisma.order.findMany({
      where: { employeeProfileId: m.id },
      include: { provider: { select: { businessName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dropClaim.findMany({
      where: { employeeProfileId: m.id },
      include: { drop: { select: { title: true, provider: { select: { businessName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.perkPackage.findMany({ where: { employeeProfileId: m.id, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);

  const empty = orders.length === 0 && claims.length === 0 && pending.length === 0;

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <p className="text-sm font-semibold tracking-wide text-gold-ink">MY PERKS</p>
      <h1 className="text-2xl font-bold">Your wallet</h1>
      <p className="mt-1 text-sm text-muted">Every voucher code in one place. Show it at the provider to redeem.</p>

      {empty && (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper px-5 py-8 text-center">
          <p className="text-sm text-muted">No vouchers yet. Pick a perk and send it to HR to get started.</p>
          <Link href="/dashboard/employee" className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-white">Browse perks →</Link>
        </div>
      )}

      {orders.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted">Approved vouchers</h2>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{o.title}</p>
                    <p className="truncate text-xs text-muted">{o.provider.businessName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${o.status === "REDEEMED" ? "bg-cream text-muted" : "bg-primary-soft text-primary"}`}>
                    {o.status === "REDEEMED" ? "redeemed" : "ready"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-cream px-3 py-2">
                  <span className="font-mono text-sm font-bold tracking-wide">{o.code}</span>
                  <span className="text-xs text-muted">show to redeem</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {claims.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted">Flash drops claimed</h2>
          <ul className="space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.drop.title}</p>
                  <p className="truncate text-xs text-muted">{c.drop.provider.businessName}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-cream px-2.5 py-1 font-mono text-sm font-bold">{c.code}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted">Awaiting HR approval</h2>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/employee/package/${p.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4">
                  <span className="min-w-0 truncate text-sm font-medium">{p.label}</span>
                  <span className="shrink-0 text-sm"><span className="text-ink-soft"><Coins amount={toCoins(p.totalLek)} /></span> <span className="font-semibold text-accent">⏳</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
