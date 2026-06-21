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

  const [orderAgg, memberCount] = await Promise.all([
    prisma.order.aggregate({
      where: { companyId: m.companyId },
      _sum: { grossLek: true, feeLek: true, netLek: true },
    }),
    prisma.employeeProfile.count({ where: { companyId: m.companyId } }),
  ]);
  const perkSpend = orderAgg._sum.grossLek ?? 0;
  const perxTake = orderAgg._sum.feeLek ?? 0;
  const toProviders = orderAgg._sum.netLek ?? 0;

  const planName = active ? company.billingPlan || "Perx for Teams" : "Not subscribed";

  return (
    <main className="page">
      <h1 className="h1">Billing</h1>

      {/* Current plan — dark .plan card */}
      <div className="plan" style={{ marginTop: 18 }}>
        <div className="flex items-center justify-between">
          <div className="kicker text-lime">Current plan</div>
          <span className={`pill ${active ? "pill-ready" : "pill-redeemed"}`}>
            <span className="dot" />
            {active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
        <div className="pname" style={{ margin: "8px 0" }}>{planName}</div>
        <div style={{ color: "#fff9" }}>
          {active
            ? `${memberCount} ${memberCount === 1 ? "seat" : "seats"} · billed monthly via Lemon Squeezy`
            : "AI perk packs, recognition, and the provider marketplace · billed monthly via Lemon Squeezy"}
        </div>
        {!active && !billingConfigured() && (
          <p className="muted" style={{ fontSize: 13, marginTop: 14, color: "#fff9" }}>
            Billing keys not configured.
          </p>
        )}
      </div>

      {/* Marketplace activity — the .inv "next invoice" card */}
      <div className="inv" style={{ marginTop: 16 }}>
        <h3 className="display" style={{ fontSize: 18, marginBottom: 6 }}>Your marketplace activity</h3>
        <div className="li"><span>Perk budget settled</span><span><Coins amount={toCoins(perkSpend)} /></span></div>
        <div className="li"><span>Paid to local providers</span><span><Coins amount={toCoins(toProviders)} /></span></div>
        <div className="li tot"><span>Perx take-rate</span><span><Coins amount={toCoins(perxTake)} /></span></div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {!active && billingConfigured() ? (
            <SubscribeButton />
          ) : (
            <a className="btn btn-soft" href="https://app.lemonsqueezy.com" target="_blank" rel="noreferrer">
              Manage in Lemon Squeezy
            </a>
          )}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          Payment processing via Lemon Squeezy · providers settle in real Lek, you only ever see coins.
        </p>
      </div>

      {/* How Perx earns — the two revenue rails */}
      <div className="grid g-2 mt-6 items-stretch">
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
    </main>
  );
}
