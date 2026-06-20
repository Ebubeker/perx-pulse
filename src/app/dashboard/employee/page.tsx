import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { BudgetRing } from "@/components/BudgetRing";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EmployeeHome() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  if (m.role !== "EMPLOYEE") redirect("/dashboard/company");

  const { t } = await getT();
  const [latest, approvedAgg] = await Promise.all([
    prisma.perkPackage.findFirst({ where: { employeeProfileId: m.id }, orderBy: { createdAt: "desc" } }),
    prisma.perkPackage.aggregate({ where: { employeeProfileId: m.id, status: "APPROVED" }, _sum: { totalLek: true } }),
  ]);
  const used = approvedAgg._sum.totalLek ?? 0;

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm text-muted">{t("common.morning")}</p>
      <h1 className="text-2xl font-bold">{m.displayName} 👋</h1>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-paper p-5">
        <BudgetRing used={used} total={m.perksBudgetLek} />
        <div className="min-w-0">
          <p className="text-sm text-muted">{t("home.budget")} · {m.company.brandName || m.company.name}</p>
          <Link href="/dashboard/recognition" className="mt-1 block text-lg font-bold text-gold-ink">
            {m.recognitionCoins.toLocaleString("en-US")} {t("home.coins")} →
          </Link>
        </div>
      </div>

      <Link href="/dashboard/employee/pulse" className="mt-5 block rounded-xl bg-primary px-5 py-4 text-center text-[15px] font-semibold text-white">
        {t("home.pulse")}
      </Link>
      <Link href="/dashboard/employee/genie" className="mt-3 block rounded-xl border border-violet/30 bg-violet-soft px-5 py-3 text-center text-sm font-semibold text-violet">
        {t("home.genie")}
      </Link>
      <Link href="/dashboard/recognition" className="mt-3 block rounded-xl border border-gold-ink/30 bg-cream px-5 py-3 text-center text-sm font-semibold text-gold-ink">
        {t("home.recognize")}
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link href="/dashboard/employee/drops" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">{t("home.drops")}</Link>
        <Link href="/dashboard/employee/passport" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">{t("home.passport")}</Link>
        <Link href="/dashboard/team" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">{t("home.team")}</Link>
        <Link href="/dashboard/leaderboard" className="rounded-xl border border-line bg-paper px-4 py-3 text-center text-sm font-semibold">{t("home.leaderboard")}</Link>
      </div>

      {latest && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted">{t("home.latest")}</h2>
          <Link href={`/dashboard/employee/package/${latest.id}`} className="block rounded-xl border border-line bg-paper px-4 py-3">
            <span className="font-medium">{latest.label}</span>{" "}
            <span className="text-sm text-muted">· {latest.totalLek.toLocaleString("en-US")} L · {t(`status.${latest.status}`)}</span>
          </Link>
        </div>
      )}
    </main>
  );
}
