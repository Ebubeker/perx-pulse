import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { BudgetRing } from "@/components/BudgetRing";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { DRAFT: "draft", PENDING: "awaiting approval", APPROVED: "approved", REJECTED: "declined" };
const STATUS_CLR: Record<string, string> = { DRAFT: "text-muted", PENDING: "text-accent", APPROVED: "text-primary", REJECTED: "text-muted" };

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireCompanyAdmin();

  const member = await prisma.employeeProfile.findFirst({
    where: { id, companyId: admin.companyId },
    include: { department: true },
  });
  if (!member) redirect("/dashboard/company/people");

  const [packages, approvedAgg, pulseCount, givenAgg] = await Promise.all([
    prisma.perkPackage.findMany({ where: { employeeProfileId: member.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.perkPackage.aggregate({ where: { employeeProfileId: member.id, status: "APPROVED" }, _sum: { totalLek: true } }),
    prisma.pulse.count({ where: { employeeProfileId: member.id } }),
    prisma.coinTxn.aggregate({ where: { fromEmployeeId: member.id, kind: "KUDOS" }, _sum: { amount: true } }),
  ]);
  const used = approvedAgg._sum.totalLek ?? 0;
  const tags = [...member.preferredCategories, ...member.interests, ...member.wellnessGoals].slice(0, 8);

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <p className="text-sm text-muted">{member.role}{member.department ? ` · ${member.department.name}` : ""}</p>
      <h1 className="text-2xl font-bold">{member.displayName}</h1>
      {member.jobTitle && <p className="text-muted">{member.jobTitle}</p>}

      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-paper p-5">
        <BudgetRing used={used} total={member.perksBudgetLek} />
        <div>
          <p className="text-sm text-muted">Budget used</p>
          <p className="text-lg font-bold">{used.toLocaleString("en-US")} / {member.perksBudgetLek.toLocaleString("en-US")} L</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-gold-ink">{member.recognitionCoins}</p>
          <p className="text-xs text-muted">coins</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{givenAgg._sum.amount ?? 0}</p>
          <p className="text-xs text-muted">kudos given</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{pulseCount}</p>
          <p className="text-xs text-muted">pulses</p>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-muted">Interests</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tg, i) => (
              <span key={`${tg}-${i}`} className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink-soft">{tg}</span>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-2 mt-8 font-semibold">Packages ({packages.length})</h2>
      {packages.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No packages yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {packages.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0 truncate text-sm font-medium">{p.label}</span>
              <span className="shrink-0 text-sm">
                <span className="text-ink-soft">{p.totalLek.toLocaleString("en-US")} L</span>
                <span className={`ml-2 font-semibold ${STATUS_CLR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Link href="/dashboard/company/people" className="text-sm font-semibold text-muted">← All people</Link>
      </div>
    </main>
  );
}
