import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { billingConfigured } from "@/lib/billing";
import { toCoins, toUsd } from "@/lib/currency";
import {
  billableSeats,
  ratePerSeatLek,
  subscriptionMonthlyLek,
  subscriptionMonthlyUsd,
  coinCommissionUsd,
} from "@/lib/pricing";
import { Coins } from "@/components/Coins";
import { SubscribeButton } from "./SubscribeButton";
import { BuyCoins } from "./BuyCoins";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const m = await requireCompanyAdmin();
  const company = m.company;
  const active = company.billingStatus === "active";

  const [orderAgg, memberCount, topupAgg] = await Promise.all([
    prisma.order.aggregate({ where: { companyId: m.companyId }, _sum: { grossLek: true, feeLek: true, netLek: true } }),
    prisma.employeeProfile.count({ where: { companyId: m.companyId } }),
    prisma.coinTxn.aggregate({ where: { companyId: m.companyId, kind: "TOPUP" }, _sum: { amount: true } }),
  ]);
  const perkSpend = orderAgg._sum.grossLek ?? 0;
  const perxTakeLek = orderAgg._sum.feeLek ?? 0;
  const toProviders = orderAgg._sum.netLek ?? 0;
  const coinsBought = topupAgg._sum.amount ?? 0;
  const commissionUsd = coinCommissionUsd(coinsBought);

  // Dynamic, tiered seat pricing
  const seats = billableSeats(memberCount);
  const rate = ratePerSeatLek(memberCount);
  const monthlyLek = subscriptionMonthlyLek(memberCount);
  const monthlyUsd = subscriptionMonthlyUsd(memberCount);

  return (
    <main className="page">
      <h1 className="h1">Billing &amp; revenue</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Two rails fund Perx: a dynamic per-seat subscription, and a small float commission when you buy coins. Providers always settle in real Lek.
      </p>

      {/* Dynamic subscription — dark .plan card */}
      <div className="plan" style={{ marginTop: 18 }}>
        <div className="flex items-center justify-between">
          <div className="kicker text-lime">Perx for Teams · subscription</div>
          <span className={`pill ${active ? "pill-ready" : "pill-redeemed"}`}>
            <span className="dot" />
            {active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
        <div className="pname" style={{ margin: "10px 0 4px" }}>
          {monthlyLek.toLocaleString("en-US")} <span style={{ fontSize: 18 }}>ALL</span>
          <span style={{ fontSize: 16, color: "#fff9", fontWeight: 500 }}> / month</span>
        </div>
        <div style={{ color: "#fff9" }}>
          {seats.toLocaleString("en-US")} seats × {rate} ALL/seat · ≈ ${monthlyUsd.toLocaleString("en-US")}/mo
          {memberCount < seats && <span> · {memberCount} active (100-seat minimum)</span>}
        </div>

        {/* tier ladder */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "100–250 seats", rate: 400, on: seats <= 250 },
            { label: "251–1,000", rate: 350, on: seats > 250 && seats <= 1000 },
            { label: "1,000+", rate: 300, on: seats > 1000 },
          ].map((t) => (
            <span
              key={t.label}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={t.on ? { background: "var(--lime)", color: "var(--ink)" } : { background: "#ffffff1a", color: "#fff9" }}
            >
              {t.label} · {t.rate} ALL
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {!active && billingConfigured() ? (
            <SubscribeButton />
          ) : active ? (
            <a className="btn btn-soft" href="https://app.lemonsqueezy.com" target="_blank" rel="noreferrer">Manage in Lemon Squeezy</a>
          ) : (
            <span className="text-sm" style={{ color: "#fff9" }}>Billing keys not configured.</span>
          )}
        </div>
      </div>

      {/* Buy coins (treasury) */}
      <div style={{ marginTop: 16 }}>
        <BuyCoins balance={company.treasuryCoins} />
      </div>

      {/* How Perx earns — three revenue rails, in real money */}
      <div className="sec mt-6"><h3>How Perx earns</h3></div>
      <div className="g-3 items-stretch">
        <div className="card">
          <div className="kicker">1 · Subscription</div>
          <p className="mt-2 text-sm text-muted">Dynamic per-seat SaaS fee — the recurring revenue spine.</p>
          <p className="mt-3 font-display text-2xl font-bold">{monthlyLek.toLocaleString("en-US")} <span className="text-base text-muted">ALL/mo</span></p>
        </div>
        <div className="card">
          <div className="kicker">2 · Provider take-rate</div>
          <p className="mt-2 text-sm text-muted">A small % of every settled perk — paid by providers, not you.</p>
          <p className="mt-3 font-display text-2xl font-bold text-coral">{perxTakeLek.toLocaleString("en-US")} <span className="text-base text-muted">ALL earned</span></p>
        </div>
        <div className="card">
          <div className="kicker">3 · Coin float commission</div>
          <p className="mt-2 text-sm text-muted">$1 per 100 coins bought into treasury ({coinsBought.toLocaleString("en-US")} bought).</p>
          <p className="mt-3 font-display text-2xl font-bold text-lime-deep">${commissionUsd.toLocaleString("en-US")} <span className="text-base text-muted">earned</span></p>
        </div>
      </div>

      {/* Marketplace activity — employer sees coins */}
      <div className="inv" style={{ marginTop: 24 }}>
        <h3 className="display" style={{ fontSize: 18, marginBottom: 6 }}>Your marketplace activity</h3>
        <div className="li"><span>Perk budget settled</span><span><Coins amount={toCoins(perkSpend)} /></span></div>
        <div className="li"><span>Paid to local providers</span><span><Coins amount={toCoins(toProviders)} /></span></div>
        <div className="li tot"><span>Perx take-rate</span><span>{perxTakeLek.toLocaleString("en-US")} L · ${toUsd(perxTakeLek)}</span></div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          Payment processing via Lemon Squeezy · providers settle in real Lek, your team only ever sees coins.
        </p>
      </div>
    </main>
  );
}
