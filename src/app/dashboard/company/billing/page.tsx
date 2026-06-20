import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { billingConfigured } from "@/lib/billing";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { SubscribeButton } from "./SubscribeButton";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const m = await requireCompanyAdmin();
  const company = m.company;
  const active = company.billingStatus === "active";

  const orderAgg = await prisma.order.aggregate({
    where: { companyId: m.companyId },
    _sum: { grossLek: true, feeLek: true, netLek: true },
  });
  const perkSpend = orderAgg._sum.grossLek ?? 0;
  const perxTake = orderAgg._sum.feeLek ?? 0;
  const toProviders = orderAgg._sum.netLek ?? 0;

  return (
    <main className="page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="kicker text-coral">Perx for Teams</div>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Billing</h1>
        </div>
        {!active && billingConfigured() && <SubscribeButton />}
      </div>

      {/* Current plan + the two revenue rails */}
      <div className="grid g-2 mt-6 items-stretch">
        {/* Current plan — dark plan card */}
        <div className="card-dark">
          <div className="blob" />
          <div className="relative z-[2]">
            <div className="flex items-center justify-between gap-3">
              <div className="kicker text-lime">Current plan</div>
              <span className={`pill ${active ? "pill-ready" : "pill-redeemed"}`}>
                <span className="dot" />
                {active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-[var(--txt-on-dark)]">
              {active ? company.billingPlan || "Perx Business" : "Not subscribed"}
            </div>
            {active ? (
              <p className="mt-1.5 text-sm text-[var(--txt-on-dark-mut)]">
                Subscribed{company.subscribedAt ? ` since ${company.subscribedAt.toISOString().slice(0, 10)}` : ""} · billed via Lemon Squeezy. Thanks for running on Perx.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-[var(--txt-on-dark-mut)]">
                AI perk packs, recognition, and the provider marketplace. Checkout runs on Lemon Squeezy (test mode).
              </p>
            )}
            {!active && !billingConfigured() && (
              <p className="mt-4 text-sm text-[var(--txt-on-dark-mut)]">Billing keys not configured.</p>
            )}
          </div>
        </div>

        <div className="grid gap-[18px]">
          <div className="card">
            <div className="kicker">1 · Subscription</div>
            <p className="mt-2 text-sm text-muted">A flat SaaS fee your company pays Perx.</p>
            <p className="mt-3 font-display text-xl font-bold">{active ? "Active" : "—"}</p>
          </div>
          <div className="card">
            <div className="kicker">2 · Provider take-rate</div>
            <p className="mt-2 text-sm text-muted">Perx keeps a small % of every settled perk — paid by providers, not you.</p>
            <p className="mt-3 font-display text-xl font-bold text-coral"><Coins amount={toCoins(perxTake)} /> earned</p>
          </div>
        </div>
      </div>

      {/* Marketplace activity — the "next invoice" rail, made legible */}
      <div className="sec"><h3>Your marketplace activity</h3></div>
      <div className="card">
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-muted">Perk budget settled</span>
            <span className="font-display text-lg font-bold"><Coins amount={toCoins(perkSpend)} /></span>
          </li>
          <li className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-muted">Paid to local providers</span>
            <span className="font-display text-lg font-bold text-coral"><Coins amount={toCoins(toProviders)} /></span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted">Perx take-rate</span>
            <span className="font-display text-lg font-bold text-coral"><Coins amount={toCoins(perxTake)} /></span>
          </li>
        </ul>
        <p className="mt-4 text-[13px] text-muted">Payment processing via Lemon Squeezy. Providers settle in real Lek; you only ever see coins.</p>
      </div>
    </main>
  );
}
