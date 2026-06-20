import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function CompanyDashboard() {
  const m = await requireCompanyAdmin();

  const [pendingCount, approvedAgg, headcount] = await Promise.all([
    prisma.perkPackage.count({ where: { companyId: m.companyId, status: "PENDING" } }),
    prisma.perkPackage.aggregate({ where: { companyId: m.companyId, status: "APPROVED" }, _sum: { totalLek: true } }),
    prisma.employeeProfile.count({ where: { companyId: m.companyId } }),
  ]);
  const settled = approvedAgg._sum.totalLek ?? 0;
  const subscribed = m.company.billingStatus === "active";
  const budgetCoins = toCoins(m.company.defaultBudgetLek);

  return (
    <main className="mx-auto max-w-2xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="kicker">Company · {m.role}</div>
        <Link
          href="/dashboard/company/billing"
          className={`pill ${subscribed ? "pill-ready" : "pill-approved"}`}
        >
          <span className="dot" />
          {subscribed ? "Perx Business · Active" : "Activate plan →"}
        </Link>
      </div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{m.company.brandName || m.company.name}</h1>
      <p className="mt-1 text-muted">
        Budget <Coins amount={budgetCoins} className="font-semibold text-ink-soft" /> per employee.
      </p>

      {/* KPI stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="stat">
          <div className="k">Active people</div>
          <div className="v">{headcount}</div>
          <div className="d">on your team</div>
        </div>
        <Link href="/dashboard/company/approvals" className="stat block">
          <div className="k">Pending approvals</div>
          <div className="v text-coral">{pendingCount}</div>
          <div className="d text-coral">{pendingCount > 0 ? "awaiting you · review →" : "all caught up"}</div>
        </Link>
        <div className="stat">
          <div className="k">Coins settled</div>
          <div className="v text-lime-deep">{toCoins(settled).toLocaleString("en-US")}</div>
          <div className="d">approved this cycle</div>
        </div>
        <div className="stat">
          <div className="k">Per-employee budget</div>
          <div className="v">{budgetCoins.toLocaleString("en-US")}</div>
          <div className="d">coins · tax-free</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="sec"><h3>Quick links</h3></div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/company/insights" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="chart" size={20} /><span>Insights</span></Link>
        <Link href="/dashboard/recognition" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="medal" size={20} /><span>Recognition</span></Link>
        <Link href="/dashboard/leaderboard" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="trophy" size={20} /><span>Leaderboard</span></Link>
        <Link href="/dashboard/team" className="tile flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="team" size={20} /><span>Team packs</span></Link>
        <Link href="/dashboard/company/people" className="tile col-span-2 flex flex-col items-center gap-1.5 text-center text-sm font-semibold"><Icon name="settings" size={20} /><span>Manage people</span></Link>
      </div>
    </main>
  );
}
