import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

const MOOD_COLOR: Record<string, string> = {
  Stressful: "var(--coral)",
  Tiring: "var(--brown)",
  Productive: "var(--lime)",
  Social: "#C9C2AE",
  Flat: "#C9C2AE",
};

export default async function CompanyDashboard() {
  const m = await requireCompanyAdmin();

  const [pendingCount, newTodayCount, approvedAgg, headcount, budgetAgg, pulses, recent] = await Promise.all([
    prisma.perkPackage.count({ where: { companyId: m.companyId, status: "PENDING" } }),
    prisma.perkPackage.count({
      where: {
        companyId: m.companyId,
        status: "PENDING",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.perkPackage.aggregate({
      where: { companyId: m.companyId, status: "APPROVED" },
      _sum: { totalLek: true },
      _avg: { totalLek: true },
      _count: true,
    }),
    prisma.employeeProfile.count({ where: { companyId: m.companyId } }),
    prisma.employeeProfile.aggregate({ where: { companyId: m.companyId }, _sum: { perksBudgetLek: true } }),
    prisma.pulse.findMany({ where: { employee: { companyId: m.companyId } }, select: { answers: true } }),
    prisma.perkPackage.findMany({
      where: { companyId: m.companyId, status: { in: ["APPROVED", "REJECTED"] } },
      include: { employee: { select: { displayName: true } } },
      orderBy: { decidedAt: "desc" },
      take: 4,
    }),
  ]);

  const settledLek = approvedAgg._sum.totalLek ?? 0;
  const avgPackLek = Math.round(approvedAgg._avg.totalLek ?? 0);
  const budgetTotalLek = budgetAgg._sum.perksBudgetLek ?? 0;
  const spendPct = budgetTotalLek ? Math.min(100, Math.round((settledLek / budgetTotalLek) * 100)) : 0;
  const remainingCoins = toCoins(Math.max(0, budgetTotalLek - settledLek));
  const subscribed = m.company.billingStatus === "active";

  // This week's sentiment — share of each mood across all pulses.
  const MOODS = ["Stressful", "Tiring", "Productive", "Social", "Flat"] as const;
  const moodCount = new Map<string, number>(MOODS.map((mm) => [mm, 0]));
  for (const p of pulses) {
    const week = (p.answers as Record<string, string> | null)?.week;
    if (week && moodCount.has(week)) moodCount.set(week, (moodCount.get(week) ?? 0) + 1);
  }
  const moodTotal = [...moodCount.values()].reduce((s, n) => s + n, 0);
  const sentiment = MOODS.map((mood) => ({
    mood,
    pct: moodTotal ? Math.round(((moodCount.get(mood) ?? 0) / moodTotal) * 100) : 0,
  }))
    .filter((x) => x.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  return (
    <main className="page">
      <div className="kicker text-coral">{m.company.brandName || m.company.name} · Company</div>
      <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Dashboard</h1>

      {/* KPI stats */}
      <div className="grid g-4 mt-6">
        <div className="stat">
          <div className="k">Coins settled</div>
          <div className="v text-lime-deep">{toCoins(settledLek).toLocaleString("en-US")}</div>
          <div className="d">of {toCoins(budgetTotalLek).toLocaleString("en-US")} budget · {spendPct}%</div>
          <div className="bar mt-2.5"><i style={{ width: `${spendPct}%` }} /></div>
        </div>
        <Link href="/dashboard/company/approvals" className="stat block">
          <div className="k">Pending approvals</div>
          <div className="v text-coral">{pendingCount}</div>
          <div className="d text-coral">
            {pendingCount === 0
              ? "all caught up"
              : `${newTodayCount} new today · review →`}
          </div>
        </Link>
        <div className="stat">
          <div className="k">Active people</div>
          <div className="v">{headcount}</div>
          <div className="d">on your team</div>
        </div>
        <div className="stat">
          <div className="k">Avg. pack value</div>
          <div className="v">{toCoins(avgPackLek).toLocaleString("en-US")}</div>
          <div className="d">coins · tax-free</div>
        </div>
      </div>

      {/* Talent edge + sentiment */}
      <div className="grid g-2 mt-[18px]">
        <div className="edge">
          <Mascot mood="cheer" size={116} />
          <div>
            <div className="kicker text-lime-deep">Your talent edge</div>
            <div className="my-1.5 max-w-[360px] text-lg font-bold">
              Teams on Perx report <span className="big">+34%</span> benefit satisfaction and retain staff 1.4× longer.
            </div>
            <Link className="btn btn-lime" href="/dashboard/company/insights">See your Perx Score →</Link>
          </div>
        </div>
        <div className="card">
          <div className="sec mt-0">
            <h3>This week&apos;s sentiment</h3>
            <Link className="link" href="/dashboard/company/insights">Insights →</Link>
          </div>
          {sentiment.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted">No pulses yet this week.</p>
          ) : (
            sentiment.map((x, i) => (
              <div key={x.mood} className={`metric ${i === sentiment.length - 1 ? "mb-0" : ""}`}>
                <div className="top">
                  <span className="k">{x.mood}</span>
                  <span>{x.pct}%</span>
                </div>
                <div className={`bar ${x.mood === "Stressful" ? "coral" : ""}`}>
                  <i style={{ width: `${x.pct}%`, background: MOOD_COLOR[x.mood] }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Budget headroom + recent activity */}
      <div className="sec"><h3>Recent activity</h3></div>
      {recent.length === 0 ? (
        <div className="card text-center text-sm text-muted">
          No decisions yet. {remainingCoins.toLocaleString("en-US")} coins of budget still available.
        </div>
      ) : (
        <div className="grid g-2">
          {recent.map((p) => (
            <div key={p.id} className="row mb-0">
              <Avatar name={p.employee.displayName} seed={p.employeeProfileId} size={42} />
              <div className="grow">
                <div className="t truncate">
                  {p.status === "APPROVED" ? "Approved" : "Declined"} · {p.employee.displayName} — {p.label}
                </div>
                <div className="s">
                  <Coins amount={toCoins(p.totalLek)} /> · {p.status === "APPROVED" ? "tax-free" : "no charge"}
                </div>
              </div>
              {p.status === "APPROVED" ? (
                <Link href={`/dashboard/company/approvals/${p.id}`} className="pill pill-approved shrink-0">
                  <span className="dot" />Settled
                </Link>
              ) : (
                <span className="pill pill-redeemed shrink-0"><span className="dot" />Declined</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!subscribed && (
        <div className="sec"><h3>Plan</h3></div>
      )}
      {!subscribed && (
        <Link href="/dashboard/company/billing" className="card flex items-center gap-3">
          <span className="pill pill-approved"><span className="dot" />Activate plan →</span>
          <span className="text-sm text-muted">Unlock unlimited approvals and insights for your team.</span>
        </Link>
      )}
    </main>
  );
}
