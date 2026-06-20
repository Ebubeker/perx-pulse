import Link from "next/link";
import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { setOfferActive, deleteOffer } from "@/lib/offer-actions";
import { OfferForm } from "./OfferForm";
import { RedeemButton } from "./RedeemButton";

export const dynamic = "force-dynamic";

export default async function ProviderDashboard() {
  const p = await requireProvider();
  const [offers, orders, earnedAgg] = await Promise.all([
    prisma.offer.findMany({ where: { providerId: p.id }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({
      where: { providerId: p.id },
      include: { employee: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.order.aggregate({ where: { providerId: p.id }, _sum: { netLek: true } }),
  ]);
  const earned = earnedAgg._sum.netLek ?? 0;
  const toRedeem = orders.filter((o) => o.status === "PAID").length;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-muted">Provider · {p.category}</p>
      <h1 className="text-2xl font-bold">{p.businessName}</h1>
      <p className="mt-1 text-muted">
        List the offers employees can pick. They reach you as <strong>pre-funded, employer-approved</strong> customers.
      </p>

      <Link href="/dashboard/provider/drops" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-semibold text-white">
        ⚡ Manage flash drops
      </Link>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-primary">{earned.toLocaleString("en-US")}</p>
          <p className="text-xs text-muted">L earned (net)</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted">orders</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-accent">{toRedeem}</p>
          <p className="text-xs text-muted">to redeem</p>
        </div>
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Incoming orders</h2>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
          No orders yet. When an employee&apos;s pack is approved, paid orders land here.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{o.title}</p>
                <p className="text-sm text-muted">
                  {o.employee.displayName} · <span className="font-mono">{o.code}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold text-primary">+{o.netLek.toLocaleString("en-US")} L</span>
                {o.status === "PAID" ? (
                  <RedeemButton orderId={o.id} />
                ) : (
                  <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">redeemed</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-semibold">Add an offer</h2>
        <OfferForm providerCategory={p.category} />
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Your offers ({offers.length})</h2>
      {offers.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No offers yet — add your first above.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {offers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {o.title} {!o.active && <span className="text-xs text-muted">(hidden)</span>}
                </p>
                <p className="text-sm text-muted">
                  {o.priceLek.toLocaleString("en-US")} L · {o.category}
                  {o.area ? ` · ${o.area}` : ""}
                  {o.taxFree ? " · tax-free" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={setOfferActive.bind(null, o.id, !o.active)}>
                  <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">
                    {o.active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteOffer.bind(null, o.id)}>
                  <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-accent">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
