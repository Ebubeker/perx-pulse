import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import { Mascot } from "@/components/Mascot";

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

  const balance = m.recognitionCoins;
  const allowance = toCoins(m.perksBudgetLek);
  const ringP = Math.min(100, Math.round((balance / Math.max(allowance, 1)) * 100));

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* heading + mascot */}
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">Your balance</div>
          <h1>PerxCoin Wallet</h1>
        </div>
        <Mascot mood="charged" size={66} className="float" />
      </div>

      {/* PerxCoin balance — dark card with ring (home pattern) */}
      <div className="card-dark mt-3">
        <div className="blob" />
        <div className="relative z-[2] flex items-center gap-4">
          <div className="ring" style={{ "--p": ringP, "--size": "118px" } as React.CSSProperties}>
            <div className="ring-c"><b>{balance.toLocaleString("en-US")}</b><span>coins</span></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[var(--txt-on-dark-mut)]">Available · earns you perks</div>
            <div className="mt-1 inline-flex items-center gap-1 font-display text-[15px] font-semibold text-[var(--txt-on-dark)]">{allowance}<CoinIcon className="size-[0.9em]" />/mo from your employer</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/employee#browse" className="coin"><CoinIcon className="size-4" />Redeem</Link>
              <Link href="/dashboard/recognition" className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-semibold text-[var(--txt-on-dark)]">Send kudos</Link>
            </div>
          </div>
        </div>
      </div>

      {empty && (
        <div className="mt-5 flex items-center gap-3 rounded-[26px] border border-dashed border-coral/40 bg-coral-soft p-5">
          <Mascot mood="sleepy" size={52} />
          <div>
            <div className="font-display text-lg font-bold">No vouchers yet</div>
            <div className="text-sm text-muted">Pick a perk and send it to HR to get started.</div>
            <Link href="/dashboard/employee" className="link mt-1 inline-block font-semibold text-coral">Browse perks →</Link>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <section>
          <div className="sec"><h3>This week&apos;s vouchers</h3></div>
          {orders.map((o) => (
            <div key={o.id} className="row mb-2.5 flex-col items-stretch gap-2">
              <div className="flex items-center gap-3">
                <span className="ico coral">🎟</span>
                <div className="grow">
                  <div className="t truncate">{o.title}</div>
                  <div className="s truncate">{o.provider.businessName}</div>
                </div>
                <span className={`pill ${o.status === "REDEEMED" ? "pill-redeemed" : "pill-ready"}`}>
                  <span className="dot" />{o.status === "REDEEMED" ? "Redeemed" : "Ready"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--r-sm)] bg-cream px-3 py-2">
                <span className="font-mono text-sm font-bold tracking-wide">{o.code}</span>
                <span className="text-xs text-muted">show to redeem</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {claims.length > 0 && (
        <section>
          <div className="sec"><h3>Flash drops claimed</h3></div>
          {claims.map((c) => (
            <div key={c.id} className="row">
              <span className="ico">⚡</span>
              <div className="grow">
                <div className="t truncate">{c.drop.title}</div>
                <div className="s truncate">{c.drop.provider.businessName}</div>
              </div>
              <span className="shrink-0 rounded-[var(--r-sm)] bg-cream px-2.5 py-1 font-mono text-sm font-bold">{c.code}</span>
            </div>
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <div className="sec"><h3>Awaiting HR approval</h3></div>
          {pending.map((p) => (
            <Link key={p.id} href={`/dashboard/employee/package/${p.id}`} className="row">
              <span className="ico">⏳</span>
              <div className="grow">
                <div className="t truncate">{p.label}</div>
                <div className="s">Pending approval</div>
              </div>
              <span className="amt"><Coins amount={toCoins(p.totalLek)} /></span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
