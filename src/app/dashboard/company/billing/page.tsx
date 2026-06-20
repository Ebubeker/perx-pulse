import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { billingConfigured } from "@/lib/billing";
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
    <main className="mx-auto max-w-2xl px-4 py-5">
      <div className="kicker text-coral">Perx for Teams</div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Billing</h1>

      {/* Current plan — dark plan card */}
      <div className="card-dark mt-4">
        <div className="blob" />
        <div className="relative z-[2]">
          <div className="flex items-center justify-between gap-3">
            <div className="kicker text-lime">Current plan</div>
            <span className={`pill ${active ? "pill-ready" : "pill-redeemed"}`}>
              <span className="dot" />
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--txt-on-dark)]">
            {active ? company.billingPlan || "Perx Business" : "Not subscribed"}
          </div>
          {active ? (
            <p className="mt-1 text-sm text-[var(--txt-on-dark-mut)]">
              Subscribed{company.subscribedAt ? ` since ${company.subscribedAt.toISOString().slice(0, 10)}` : ""} · billed via Lemon Squeezy. Thanks for running on Perx 💚
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--txt-on-dark-mut)]">
              AI perk packs, recognition, and the provider marketplace. Checkout runs on Lemon Squeezy (test mode).
            </p>
          )}
        </div>
      </div>

      {!active && (
        <div className="mt-3">
          {billingConfigured() ? (
            <SubscribeButton />
          ) : (
            <p className="card text-sm text-muted">Billing keys not configured.</p>
          )}
        </div>
      )}

      {/* The two revenue rails, made legible */}
      <div className="sec"><h3>How Perx earns</h3></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="kicker">1 · Subscription</div>
          <p className="mt-2 text-xs text-muted">A flat SaaS fee your company pays Perx.</p>
          <p className="mt-3 font-display text-lg font-bold">{active ? "Active" : "—"}</p>
        </div>
        <div className="card">
          <div className="kicker">2 · Provider take-rate</div>
          <p className="mt-2 text-xs text-muted">Perx keeps a small % of every settled perk — paid by providers, not you.</p>
          <p className="mt-3 font-display text-lg font-bold text-coral">{perxTake.toLocaleString("en-US")} L earned</p>
        </div>
      </div>

      <div className="card mt-3">
        <h3 className="font-display text-[18px] font-bold">Your marketplace activity</h3>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex justify-between border-b border-line pb-2"><span className="text-muted">Perk budget settled</span><span className="font-semibold">{perkSpend.toLocaleString("en-US")} L</span></li>
          <li className="flex justify-between border-b border-line pb-2"><span className="text-muted">Paid to local providers</span><span className="font-semibold text-coral">{toProviders.toLocaleString("en-US")} L</span></li>
          <li className="flex justify-between"><span className="text-muted">Perx take-rate</span><span className="font-semibold text-coral">{perxTake.toLocaleString("en-US")} L</span></li>
        </ul>
      </div>
    </main>
  );
}
