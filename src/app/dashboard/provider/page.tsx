import Link from "next/link";
import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { setOfferActive, deleteOffer } from "@/lib/offer-actions";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { RedeemButton } from "./RedeemButton";

export const dynamic = "force-dynamic";

export default async function ProviderDashboard() {
  const p = await requireProvider();
  const [offers, orders, agg, paidCount, redeemedCount] = await Promise.all([
    prisma.offer.findMany({ where: { providerId: p.id }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({
      where: { providerId: p.id },
      include: { employee: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.order.aggregate({ where: { providerId: p.id }, _sum: { grossLek: true, feeLek: true, netLek: true }, _count: true }),
    prisma.order.count({ where: { providerId: p.id, status: "PAID" } }),
    prisma.order.count({ where: { providerId: p.id, status: "REDEEMED" } }),
  ]);

  const gross = agg._sum.grossLek ?? 0;
  const fee = agg._sum.feeLek ?? 0;
  const net = agg._sum.netLek ?? 0;
  const orderCount = agg._count;
  const activeOffers = offers.filter((o) => o.active).length;

  return (
    <main className="page">
      {/* heading + quick actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="kicker text-coral">{p.category}</div>
          <h1 className="h1 mt-1">{p.businessName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Your offers reach employees as <strong className="text-ink">pre-funded, employer-approved</strong> customers — no chargebacks, no dead capacity.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Link href="/dashboard/provider/offers/new" className="btn btn-primary px-5">+ Add an offer</Link>
          <Link href="/dashboard/provider/drops" className="btn btn-ghost px-5">⚡ New flash drop</Link>
        </div>
      </div>

      {/* KPI stats */}
      <div className="g-4 mt-6">
        <div className="stat">
          <div className="k">Orders</div>
          <div className="v">{orderCount}</div>
          <div className="d">All pre-funded</div>
        </div>
        <div className="stat">
          <div className="k">Earned (net)</div>
          <div className="v">{net.toLocaleString("en-US")} <span className="text-lg">L</span></div>
          <div className="d">Settles to you</div>
        </div>
        <div className="stat">
          <div className="k">To redeem</div>
          <div className="v text-coral">{paidCount}</div>
          <div className="d">{paidCount > 0 ? "Awaiting redemption" : "All caught up"}</div>
        </div>
        <div className="stat">
          <div className="k">Live offers</div>
          <div className="v">{activeOffers}<span className="text-lg text-muted">/{offers.length}</span></div>
          <div className="d">{redeemedCount} redeemed all-time</div>
        </div>
      </div>

      {/* settlement + revenue breakdown */}
      <div className="g-2 mt-5 items-stretch">
        <div className="card-dark flex flex-wrap items-center gap-4">
          <span className="blob" />
          <div className="relative"><Mascot mood="happy" size={104} /></div>
          <div className="relative min-w-0">
            <div className="kicker text-lime">READY TO PAY OUT</div>
            <div className="mt-1.5 font-display text-4xl font-bold">{net.toLocaleString("en-US")} <span className="text-lg">L</span></div>
            <div className="mt-1 text-sm text-white/70">
              {orderCount} order{orderCount === 1 ? "" : "s"} · auto-matched, 0 disputes — settles to your bank.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sec"><h3>How a settled order splits</h3></div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Employer pays (gross)</span>
              <span className="font-semibold">{gross.toLocaleString("en-US")} L</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Perx take-rate ({p.takeRatePct}%)</span>
              <span className="font-semibold text-coral">− {fee.toLocaleString("en-US")} L</span>
            </div>
            <div className="my-1 h-px bg-line" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">You receive (net)</span>
              <span className="font-display text-xl font-bold text-lime-deep">{net.toLocaleString("en-US")} L</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">The take-rate is paid by you on settled perks — never an upfront fee.</p>
        </div>
      </div>

      {/* orders + offers */}
      <div className="g-2 items-start">
        {/* Incoming orders */}
        <div>
          <div className="sec"><h3>Incoming orders</h3></div>
          {orders.length === 0 ? (
            <div className="card text-center text-sm text-muted">
              No orders yet. When an employee&apos;s pack is approved, paid orders land here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((o) => (
                <div key={o.id} className={`row mb-0 ${o.status !== "PAID" ? "opacity-60" : ""}`}>
                  <span className="ico coral"><Icon name="ticket" size={20} /></span>
                  <div className="grow">
                    <div className="t truncate">{o.title}</div>
                    <div className="s">{o.employee.displayName} · <span className="font-mono tracking-wider">{o.code}</span></div>
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
        </div>

        {/* Your offers manager */}
        <div>
          <div className="sec flex items-center justify-between">
            <h3>Your offers ({offers.length})</h3>
            <Link href="/dashboard/provider/offers/new" className="text-sm font-semibold text-coral">+ Add</Link>
          </div>
          {offers.length === 0 ? (
            <Link href="/dashboard/provider/offers/new" className="card block text-center text-sm text-muted transition hover:border-coral">
              No offers yet — <span className="font-semibold text-coral">add your first →</span>
            </Link>
          ) : (
            <div className="space-y-2.5">
              {offers.map((o) => (
                <div key={o.id} className={`row mb-0 ${!o.active ? "opacity-60" : ""}`}>
                  <span className="ico coral"><Icon name="ticket" size={20} /></span>
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
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link href={`/dashboard/provider/offers/${o.id}/edit`} className="btn btn-ghost px-3.5 py-2 text-sm">Edit</Link>
                    <form action={setOfferActive.bind(null, o.id, !o.active)}>
                      <button type="submit" className="btn btn-ghost px-3.5 py-2 text-sm">{o.active ? "Hide" : "Show"}</button>
                    </form>
                    <form action={deleteOffer.bind(null, o.id)}>
                      <button type="submit" className="px-2 py-2 text-sm font-semibold text-coral">Delete</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
