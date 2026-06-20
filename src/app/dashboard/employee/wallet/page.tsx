import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { CoinIcon } from "@/components/CoinIcon";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";

export const dynamic = "force-dynamic";

// Quick "spend coins" shortcuts (design: horizontal .spend scroller of .s mini-cards).
const SPEND: { icon: string; title: string; coins: number; bg?: string }[] = [
  { icon: "gift", title: "Extra day off", coins: 800 },
  { icon: "food", title: "Lunch on us", coins: 200, bg: "var(--lime-soft)" },
  { icon: "culture", title: "Cinema night", coins: 150 },
];

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

  const balance = m.recognitionCoins;
  const allowance = toCoins(m.perksBudgetLek);
  const ringP = Math.min(100, Math.round((balance / Math.max(allowance, 1)) * 100));

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="greet"><div className="day">Your balance</div><h1>PerxCoin Wallet</h1></div>
        <Mascot mood="charged" size={74} className="float" />
      </div>
      <div className="card-dark" style={{ marginTop: 14 }}><div className="blob" />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="wcard">
            <div className="lab"><CoinIcon className="size-4" /> AVAILABLE</div>
            <div className="bal">{balance.toLocaleString("en-US")}</div>
            <div style={{ color: "#fff9", fontSize: 13 }}>PerxCoin · earns you perks</div>
            <div className="wbtns">
              <Link className="btn btn-lime" href="/dashboard/employee#browse"><Icon name="gift" size={16} /> Redeem</Link>
              <Link className="btn btn-ghost" href="/dashboard/recognition" style={{ color: "#fff", borderColor: "#fff3" }}><Icon name="kudos" size={16} /> Send kudos</Link>
            </div>
          </div>
        </div>
      </div>

      <Link className="row" href="/dashboard/recognition" style={{ marginTop: 14, background: "var(--lime-soft)", borderColor: "#E3EBBE" }}>
        <span className="ico" style={{ background: "var(--lime)", color: "var(--ink)" }}><Icon name="sparkles" size={20} /></span>
        <div className="grow"><div className="t">Daily Spin</div><div className="s">Flick the spinner — free PerxCoin every day</div></div>
        <span className="limeink" style={{ fontWeight: 700, color: "var(--lime-deep)" }}>Spin →</span>
      </Link>

      <div className="sec"><h3>Spend coins</h3></div>
      <div className="spend">
        {SPEND.map((s) => (
          <Link className="s" href="/dashboard/employee#browse" key={s.title}>
            <div className="ic" style={s.bg ? { background: s.bg } : undefined}><Icon name={s.icon} size={20} /></div>
            <div className="t">{s.title}</div>
            <div className="coin sm" style={{ marginTop: 8 }}><Coins amount={s.coins} /></div>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <>
          <div className="sec"><h3>This week&apos;s vouchers</h3></div>
          {orders.map((o) => {
            const redeemed = o.status === "REDEEMED";
            return (
              <div className="row" key={o.id} style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13, width: "100%" }}>
                  <span className="ico coral"><Icon name="ticket" size={20} /></span>
                  <div className="grow"><div className="t">{o.title}</div><div className="s">{o.provider.businessName}</div></div>
                  <span className={`pill ${redeemed ? "pill-redeemed" : "pill-ready"}`}><span className="dot" />{redeemed ? "Redeemed" : "Ready"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--cream)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
                  <span className="code" style={{ fontSize: 16 }}>{o.code}</span>
                  <span style={{ fontSize: 12, color: "var(--txt-mut)" }}>{redeemed ? "used" : "show to redeem"}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {claims.length > 0 && (
        <>
          <div className="sec"><h3>Claimed drops</h3></div>
          {claims.map((c) => (
            <div className="row" key={c.id}>
              <span className="ico"><Icon name="bolt" size={20} /></span>
              <div className="grow"><div className="t">{c.drop.title}</div><div className="s">{c.drop.provider.businessName}</div></div>
              <span className="code" style={{ fontSize: 15 }}>{c.code}</span>
            </div>
          ))}
        </>
      )}

      {pending.length > 0 && (
        <>
          <div className="sec"><h3>Awaiting HR approval</h3></div>
          {pending.map((p) => (
            <Link className="row" href={`/dashboard/employee/package/${p.id}`} key={p.id}>
              <span className="ico"><Icon name="clock" size={20} /></span>
              <div className="grow"><div className="t">{p.label}</div><div className="s">Pending approval</div></div>
              <span className="amt"><Coins amount={toCoins(p.totalLek)} /></span>
            </Link>
          ))}
        </>
      )}
    </main>
  );
}
