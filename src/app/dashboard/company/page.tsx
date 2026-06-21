import Link from "next/link";
import { requireCompanyAdmin, getProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";

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
  const provider = await getProvider();

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
    <main className="mx-auto max-w-6xl px-5 py-7 md:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="kicker text-coral">{m.company.brandName || m.company.name} · Employer</div>
          <h1 className="mt-1.5 font-display text-[34px] font-extrabold leading-none tracking-tight md:text-[42px]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {!subscribed && (
            <Link
              href="/dashboard/company/billing"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold shadow-soft transition hover:border-coral hover:text-coral"
            >
              <span className="size-2 rounded-full bg-coral" /> Activate plan
            </Link>
          )}
          <Link
            href="/dashboard/company/approvals"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
          >
            {pendingCount > 0 ? `Review ${pendingCount} pending` : "All caught up"} →
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-[20px] border border-line bg-paper p-5 shadow-soft">
          <div className="kicker">This month settled</div>
          <div className="mt-2 font-display text-[30px] font-bold leading-none tracking-tight">
            {toCoins(settledLek).toLocaleString("en-US")} <span className="text-base font-semibold text-muted">coins</span>
          </div>
          <div className="mt-1.5 text-[12.5px] text-muted">of {toCoins(budgetTotalLek).toLocaleString("en-US")} · {spendPct}%</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-coral" style={{ width: `${spendPct}%` }} /></div>
        </div>

        <Link href="/dashboard/company/approvals" className="rounded-[20px] border border-line bg-paper p-5 shadow-soft transition hover:border-coral">
          <div className="kicker">Pending approvals</div>
          <div className="mt-2 font-display text-[30px] font-bold leading-none tracking-tight">{pendingCount}</div>
          <div className="mt-1.5 text-[12.5px] font-medium text-coral">
            {pendingCount === 0 ? "all caught up" : `${newTodayCount} new today · review →`}
          </div>
        </Link>

        <div className="rounded-[20px] border border-line bg-paper p-5 shadow-soft">
          <div className="kicker">Active employees</div>
          <div className="mt-2 font-display text-[30px] font-bold leading-none tracking-tight">{headcount}</div>
          <div className="mt-1.5 text-[12.5px] text-muted">on your team</div>
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-5 shadow-soft">
          <div className="kicker">Avg. pack value</div>
          <div className="mt-2 font-display text-[30px] font-bold leading-none tracking-tight">
            {toCoins(avgPackLek).toLocaleString("en-US")} <span className="text-base font-semibold text-muted">coins</span>
          </div>
          <div className="mt-1.5 text-[12.5px] text-muted">tax-free</div>
        </div>
      </div>

      {/* Talent edge + sentiment */}
      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[24px] bg-ink p-6 text-[var(--txt-on-dark)]">
          <div className="flex items-center gap-4">
            <Mascot mood="cheer" size={104} className="float shrink-0" />
            <div>
              <div className="kicker text-lime">Your talent edge</div>
              <p className="mt-2 max-w-[330px] text-[17px] font-semibold leading-snug">
                Ask Perx anything about your team, and get an AI brief on wellbeing, demand, and where to spend.
              </p>
              <Link href="/dashboard/company/insights" className="btn btn-lime mt-4 px-5">Open AI insights →</Link>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-line bg-paper p-6 shadow-soft">
          <div className="flex items-end justify-between">
            <h3 className="font-display text-xl font-bold tracking-tight">This week&apos;s sentiment</h3>
            <Link href="/dashboard/company/insights" className="text-[13px] font-semibold text-muted hover:text-coral">Heatmap →</Link>
          </div>
          {sentiment.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No pulses yet this week.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {sentiment.map((x) => (
                <div key={x.mood}>
                  <div className="mb-1.5 flex justify-between text-[13px] font-semibold"><span>{x.mood}</span><span className="text-muted">{x.pct}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full" style={{ width: `${x.pct}%`, background: MOOD_COLOR[x.mood] }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <h2 className="mb-3 mt-7 px-0.5 font-display text-xl font-bold tracking-tight">Recent activity</h2>
      {recent.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-paper p-6 text-center text-sm text-muted shadow-soft">
          No decisions yet. {remainingCoins.toLocaleString("en-US")} coins of budget still available.
        </div>
      ) : (
        <div className="grid gap-2.5">
          {recent.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-paper p-3.5 shadow-soft">
              <Avatar name={p.employee.displayName} seed={p.employeeProfileId} size={42} />
              <div className="min-w-0 grow">
                <div className="truncate font-semibold">{p.status === "APPROVED" ? "Approved" : "Declined"} · {p.employee.displayName}</div>
                <div className="truncate text-[13px] text-muted">{p.label} · <Coins amount={toCoins(p.totalLek)} /></div>
              </div>
              {p.status === "APPROVED" ? (
                <Link href={`/dashboard/company/approvals/${p.id}`} className="pill pill-approved shrink-0"><span className="dot" />Approved</Link>
              ) : (
                <span className="pill pill-redeemed shrink-0"><span className="dot" />Declined</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Become a provider */}
      {!provider && (
        <Link
          href="/onboarding/provider"
          className="mt-3.5 flex items-center gap-4 rounded-[20px] border border-line bg-paper p-5 shadow-soft transition hover:border-coral"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-coral-soft text-coral-deep"><Icon name="store" size={22} /></span>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold">Also sell on Perx</div>
            <div className="text-[13px] text-muted">List your own products &amp; perks for every company on Perx — run it all from this account.</div>
          </div>
          <span className="ml-auto text-coral">→</span>
        </Link>
      )}
    </main>
  );
}
