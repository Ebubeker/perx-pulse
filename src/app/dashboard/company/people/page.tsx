import Link from "next/link";
import { requireCompanyAdmin } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./InviteForm";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const admin = await requireCompanyAdmin();
  const [members, invites, departments] = await Promise.all([
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
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-5">
      <div className="kicker text-coral">{members.length} active · {invites.length} invited</div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Team &amp; budgets</h1>
      <p className="mt-1 text-muted">Invite teammates to {admin.company.brandName || admin.company.name}.</p>

      <div className="card mt-4">
        <h3 className="mb-3 font-display text-[18px] font-bold">Invite an employee</h3>
        <InviteForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>

      <div className="sec"><h3>Team ({members.length})</h3></div>
      <div>
        {members.map((m) => (
          <Link key={m.id} href={`/dashboard/company/people/${m.id}`} className="row">
            <span className="avatar">{(m.displayName || "?").charAt(0).toUpperCase()}</span>
            <div className="grow">
              <div className="t">{m.displayName}</div>
              <div className="s">{m.department ? m.department.name : "No department"}</div>
            </div>
            <span className="pill pill-approved">{m.role}</span>
          </Link>
        ))}
      </div>

      {invites.length > 0 && (
        <>
          <div className="sec"><h3>Pending invites ({invites.length})</h3></div>
          <div>
            {invites.map((i) => (
              <div key={i.id} className="row">
                <span className="avatar" style={{ background: "#E5E0D2", color: "var(--txt-mut)" }}>{(i.email || "?").charAt(0).toUpperCase()}</span>
                <div className="grow">
                  <div className="t">{i.email}</div>
                  <div className="s">{i.role}</div>
                </div>
                <span className="pill pill-pending"><span className="dot" />Invited</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
