import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { DRAFT: "draft", PENDING: "awaiting approval", APPROVED: "approved", REJECTED: "declined" };
const STATUS_PILL: Record<string, string> = { DRAFT: "pill-redeemed", PENDING: "pill-pending", APPROVED: "pill-ready", REJECTED: "pill-redeemed" };

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
    <main className="page">
      <Link href="/dashboard/company/people" className="link text-sm font-semibold text-muted">← All people</Link>

      {/* Profile header */}
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <Avatar name={member.displayName} seed={member.id} size={84} />
        <div className="min-w-0">
          <div className="kicker">{member.role}{member.department ? ` · ${member.department.name}` : ""}</div>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">{member.displayName}</h1>
          {member.jobTitle && <p className="mt-0.5 text-muted">{member.jobTitle}</p>}
        </div>
      </div>

      <div className="grid g-2 mt-6 items-start" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)" }}>
        {/* Left column — balance, stats, interests */}
        <div className="grid gap-[18px]">
          {/* PerxCoin balance — dark card */}
          <div className="card-dark">
            <div className="blob" />
            <div className="relative z-[2]">
              <div className="text-[13px] text-[var(--txt-on-dark-mut)]">PerxCoin balance</div>
              <div className="mt-1 font-display text-4xl font-bold text-[var(--txt-on-dark)]"><Coins amount={member.recognitionCoins} /></div>
              <div className="mt-2 text-[13px] text-[var(--txt-on-dark-mut)]">
                <Coins amount={toCoins(member.perksBudgetLek)} />/mo allowance · <Coins amount={toCoins(used)} /> spent on approved perks
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[18px]">
            <div className="stat">
              <div className="v">{givenAgg._sum.amount ?? 0}</div>
              <div className="d">kudos given</div>
            </div>
            <div className="stat">
              <div className="v">{pulseCount}</div>
              <div className="d">pulses</div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="card">
              <div className="kicker mb-3">Interests</div>
              <div className="chip-row">
                {tags.map((tg, i) => (
                  <span key={`${tg}-${i}`} className="chip">{tg}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — their packages */}
        <div>
          <div className="sec mt-0"><h3>Packages ({packages.length})</h3></div>
          {packages.length === 0 ? (
            <div className="card text-center text-sm text-muted">No packages yet.</div>
          ) : (
            <div>
              {packages.map((p) => (
                <div key={p.id} className="row">
                  <span className="ico coral"><Icon name="gift" size={20} /></span>
                  <div className="grow">
                    <div className="t truncate">{p.label}</div>
                    <span className={`pill ${STATUS_PILL[p.status]} mt-1`}>{STATUS_LABEL[p.status]}</span>
                  </div>
                  <span className="amt"><Coins amount={toCoins(p.totalLek)} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
