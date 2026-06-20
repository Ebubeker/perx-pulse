import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Company · {m.role}</p>
        <Link
          href="/dashboard/company/billing"
          className={`rounded-full px-3 py-1 text-xs font-bold ${subscribed ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent"}`}
        >
          {subscribed ? "Perx Business · Active" : "Activate plan →"}
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{m.company.brandName || m.company.name}</h1>
      <p className="mt-2 text-muted">Budget {m.company.defaultBudgetLek.toLocaleString("en-US")} L/employee.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{headcount}</p>
          <p className="text-xs text-muted">people</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-primary">{toCoins(settled).toLocaleString("en-US")} 🪙</p>
          <p className="text-xs text-muted">coins settled</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-accent">{pendingCount}</p>
          <p className="text-xs text-muted">awaiting you</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/dashboard/company/approvals" className="relative inline-block rounded-lg bg-primary px-4 py-2.5 font-semibold text-white">
          Approvals
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-xs">{pendingCount}</span>
          )}
        </Link>
        <Link href="/dashboard/company/insights" className="inline-block rounded-lg border border-line px-4 py-2.5 font-semibold">
          Insights
        </Link>
        <Link href="/dashboard/recognition" className="inline-block rounded-lg border border-line px-4 py-2.5 font-semibold">
          Recognition
        </Link>
        <Link href="/dashboard/leaderboard" className="inline-block rounded-lg border border-line px-4 py-2.5 font-semibold">
          Leaderboard
        </Link>
        <Link href="/dashboard/team" className="inline-block rounded-lg border border-line px-4 py-2.5 font-semibold">
          Team packs
        </Link>
        <Link href="/dashboard/company/people" className="inline-block rounded-lg border border-line px-4 py-2.5 font-semibold">
          Manage people
        </Link>
      </div>
    </main>
  );
}
