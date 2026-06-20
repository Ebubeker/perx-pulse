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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mt-1 text-2xl font-bold">Billing</h1>

      {/* Subscription rail */}
      <div className="mt-5 rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Your plan</p>
            <p className="text-xl font-bold">{active ? company.billingPlan || "Perx Business" : "Not subscribed"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-primary-soft text-primary" : "bg-cream text-muted"}`}>
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        {active ? (
          <p className="mt-3 text-sm text-muted">
            Subscribed{company.subscribedAt ? ` since ${company.subscribedAt.toISOString().slice(0, 10)}` : ""}. Thanks for running on Perx 💚
          </p>
        ) : (
          <div className="mt-4">
            <p className="mb-3 text-sm text-muted">
              Activate Perx for your company — AI perk packs, recognition, and the provider marketplace. Checkout runs on Lemon Squeezy (test mode).
            </p>
            {billingConfigured() ? (
              <SubscribeButton />
            ) : (
              <p className="rounded-lg border border-line bg-cream px-4 py-3 text-sm text-muted">Billing keys not configured.</p>
            )}
          </div>
        )}
      </div>

      {/* The two revenue rails, made legible */}
      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">How Perx earns</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-sm font-semibold">1 · Subscription</p>
          <p className="mt-1 text-xs text-muted">A flat SaaS fee your company pays Perx.</p>
          <p className="mt-3 text-lg font-bold">{active ? "Active" : "—"}</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-sm font-semibold">2 · Provider take-rate</p>
          <p className="mt-1 text-xs text-muted">Perx keeps a small % of every settled perk — paid by providers, not you.</p>
          <p className="mt-3 text-lg font-bold text-accent">{perxTake.toLocaleString("en-US")} L earned</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-paper p-5">
        <p className="text-sm font-semibold">Your marketplace activity</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex justify-between"><span className="text-muted">Perk budget settled</span><span className="font-semibold">{perkSpend.toLocaleString("en-US")} L</span></li>
          <li className="flex justify-between"><span className="text-muted">Paid to local providers</span><span className="font-semibold text-primary">{toProviders.toLocaleString("en-US")} L</span></li>
          <li className="flex justify-between"><span className="text-muted">Perx take-rate</span><span className="font-semibold text-accent">{perxTake.toLocaleString("en-US")} L</span></li>
        </ul>
      </div>
    </main>
  );
}
