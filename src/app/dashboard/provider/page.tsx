import Link from "next/link";
import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { setOfferActive, deleteOffer } from "@/lib/offer-actions";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
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
    <main className="mx-auto max-w-2xl px-4 py-5">
      {/* heading */}
      <div className="kicker text-coral">{p.category}</div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{p.businessName}</h1>
      <p className="mt-2 text-sm text-muted">
        List the offers employees can pick. They reach you as <strong className="text-ink">pre-funded, employer-approved</strong> customers.
      </p>

      <Link href="/dashboard/provider/drops" className="btn btn-primary mt-4">
        ⚡ Manage flash drops
      </Link>

      {/* KPI stats — revenue/settlement is real cash Lek */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="stat">
          <div className="k">Orders</div>
          <div className="v">{orders.length}</div>
          <div className="d">All pre-funded</div>
        </div>
        <div className="stat">
          <div className="k">Earned (net)</div>
          <div className="v">{earned.toLocaleString("en-US")} <span className="text-lg">L</span></div>
          <div className="d">Settles to you</div>
        </div>
        <div className="stat">
          <div className="k">To redeem</div>
          <div className="v text-coral">{toRedeem}</div>
          <div className="d">{toRedeem > 0 ? "Ready when they arrive →" : "All caught up"}</div>
        </div>
      </div>

      {/* Incoming orders */}
      <div className="sec"><h3>Incoming orders</h3></div>
      {orders.length === 0 ? (
        <div className="card text-center text-sm text-muted">
          No orders yet. When an employee&apos;s pack is approved, paid orders land here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((o) => (
            <div key={o.id} className="row mb-0">
              <span className="ico coral">💆</span>
              <div className="grow">
                <div className="t truncate">{o.title}</div>
                <div className="s">
                  {o.employee.displayName} · <span className="font-mono tracking-wider">{o.code}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="amt">+{o.netLek.toLocaleString("en-US")} L</span>
                {o.status === "PAID" ? (
                  <RedeemButton orderId={o.id} />
                ) : (
                  <span className="pill pill-redeemed"><span className="dot" />Redeemed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add an offer */}
      <div className="sec"><h3>Add an offer</h3></div>
      <div className="card">
        <OfferForm providerCategory={p.category} />
      </div>

      {/* Your offers */}
      <div className="sec"><h3>Your offers ({offers.length})</h3></div>
      {offers.length === 0 ? (
        <div className="card text-center text-sm text-muted">No offers yet — add your first above.</div>
      ) : (
        <div className="space-y-2.5">
          {offers.map((o) => (
            <div key={o.id} className={`row mb-0 ${!o.active ? "opacity-60" : ""}`}>
              <span className="ico coral">💆</span>
              <div className="grow">
                <div className="t truncate">
                  {o.title} {!o.active && <span className="badge badge-new">HIDDEN</span>}
                </div>
                <div className="s flex flex-wrap items-center gap-x-1.5">
                  <span className="font-semibold text-ink-soft"><Coins amount={toCoins(effectiveLek(o.priceLek, o.discountPct))} /></span>
                  {o.discountPct > 0 && <span>· −{o.discountPct}%</span>}
                  <span>· {o.category}</span>
                  {o.area ? <span>· {o.area}</span> : null}
                  {o.taxFree ? <span className="badge badge-tax">TAX-FREE</span> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={setOfferActive.bind(null, o.id, !o.active)}>
                  <button type="submit" className="btn btn-ghost px-4 py-2 text-sm">
                    {o.active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteOffer.bind(null, o.id)}>
                  <button type="submit" className="px-2 py-2 text-sm font-semibold text-coral">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
