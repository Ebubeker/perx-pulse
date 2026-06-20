import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Avatar } from "@/components/Avatar";
import { InviteForm } from "./InviteForm";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const admin = await requireCompanyAdmin();
  const [members, invites, departments, usedByMember] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: { companyId: admin.companyId },
      include: { department: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { companyId: admin.companyId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ where: { companyId: admin.companyId }, orderBy: { name: "asc" } }),
    prisma.perkPackage.groupBy({
      by: ["employeeProfileId"],
      where: { companyId: admin.companyId, status: "APPROVED" },
      _sum: { totalLek: true },
    }),
  ]);

  const usedMap = new Map<string, number>(
    usedByMember.map((u) => [u.employeeProfileId, u._sum.totalLek ?? 0]),
  );

  return (
    <main className="page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="kicker text-coral">{members.length} active · {invites.length} invited</div>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Team &amp; budgets</h1>
          <p className="mt-1 text-muted">Invite teammates to {admin.company.brandName || admin.company.name}.</p>
        </div>
      </div>

      <div className="grid g-2 mt-6 items-start" style={{ gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)" }}>
        {/* Team table */}
        <div>
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-[var(--cream-2)] shadow-[var(--sh-1)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[.1em] text-muted">Employee</th>
                  <th className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[.1em] text-muted">Role</th>
                  <th className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[.1em] text-muted">Monthly budget</th>
                  <th className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[.1em] text-muted">Used</th>
                  <th className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[.1em] text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const used = usedMap.get(m.id) ?? 0;
                  const pct = m.perksBudgetLek > 0 ? Math.round((used / m.perksBudgetLek) * 100) : 0;
                  const over = pct > 100;
                  return (
                    <tr key={m.id} className="border-t border-line align-middle transition-colors hover:bg-[var(--cream)]">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/company/people/${m.id}`} className="flex items-center gap-2.5">
                          <Avatar name={m.displayName} seed={m.id} size={34} />
                          <span className="font-semibold">{m.displayName}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{m.department ? m.department.name : m.role}</td>
                      <td className="px-4 py-3 font-display font-bold"><Coins amount={toCoins(m.perksBudgetLek)} /></td>
                      <td className={`px-4 py-3 text-sm font-semibold ${over ? "text-coral" : ""}`}>{pct}%</td>
                      <td className="px-4 py-3">
                        <span className={`pill ${over ? "pill-pending" : "pill-ready"}`}>
                          <span className="dot" />{over ? "Over" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {invites.map((i) => (
                  <tr key={i.id} className="border-t border-line align-middle">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: "#E5E0D2", color: "var(--txt-mut)" }}>
                          {(i.email || "?").charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-muted">{i.email}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{i.role}</td>
                    <td className="px-4 py-3 font-display font-bold text-muted">—</td>
                    <td className="px-4 py-3 text-sm text-muted">—</td>
                    <td className="px-4 py-3">
                      <span className="pill pill-pending"><span className="dot" />Invited</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {members.length === 0 && invites.length === 0 && (
            <div className="card mt-3 text-center text-sm text-muted">No teammates yet. Send your first invite →</div>
          )}
        </div>

        {/* Invite form */}
        <div className="card">
          <h3 className="mb-4 font-display text-[18px] font-bold">Invite an employee</h3>
          <InviteForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
        </div>
      </div>
    </main>
  );
}
