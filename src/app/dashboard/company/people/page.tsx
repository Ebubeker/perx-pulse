import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Avatar } from "@/components/Avatar";
import { InviteForm } from "./InviteForm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", HR: "HR", FINANCE: "Finance", EMPLOYEE: "Employee" };
const roleLabel = (r: string) => ROLE_LABEL[r] ?? r;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="h1">Team &amp; budgets</h1>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Team table — the design's real <table className="ptable"> */}
        <div>
          <table className="ptable" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Monthly budget</th>
                <th>Used</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const used = usedMap.get(m.id) ?? 0;
                const pct = m.perksBudgetLek > 0 ? Math.round((used / m.perksBudgetLek) * 100) : 0;
                const over = pct > 100;
                return (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/dashboard/company/people/${m.id}`} className="inline-flex items-center gap-2.5 align-middle">
                        <Avatar name={m.displayName} seed={m.id} size={34} />
                        <b className="font-display">{m.displayName}</b>
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium">{roleLabel(m.role)}</div>
                      {m.department && <div className="text-xs text-muted">{m.department.name}</div>}
                    </td>
                    <td><b className="font-display"><Coins amount={toCoins(m.perksBudgetLek)} /></b></td>
                    <td className={over ? "text-coral font-semibold" : ""}>{pct}%</td>
                    <td>
                      <span className={`pill ${over ? "pill-pending" : "pill-ready"}`}>
                        <span className="dot" />{over ? "Over" : "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {invites.map((i) => (
                <tr key={i.id}>
                  <td>
                    <span className="inline-flex items-center gap-2.5 align-middle">
                      <span
                        className="char-av inline-grid place-items-center rounded-full font-bold"
                        style={{ width: 34, height: 34, fontSize: 13, background: "#E5E0D2", color: "var(--txt-mut)" }}
                      >
                        {(i.email || "?").charAt(0).toUpperCase()}
                      </span>
                      <b className="font-display text-muted">{i.email}</b>
                    </span>
                  </td>
                  <td>{roleLabel(i.role)}</td>
                  <td><b className="font-display">—</b></td>
                  <td>—</td>
                  <td>
                    <span className="pill pill-pending"><span className="dot" />Invited</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && invites.length === 0 && (
            <div className="card mt-3 text-center text-sm text-muted">No teammates yet. Send your first invite →</div>
          )}
        </div>

        {/* Invite form */}
        <div className="card lg:sticky lg:top-6">
          <h3 className="mb-4 font-display text-[18px] font-bold">Invite an employee</h3>
          <InviteForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
        </div>
      </div>
    </main>
  );
}
