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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mt-2 text-2xl font-bold">People</h1>
      <p className="text-muted">Invite teammates to {admin.company.brandName || admin.company.name}.</p>

      <div className="mt-6 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-semibold">Invite an employee</h2>
        <InviteForm departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Team ({members.length})</h2>
      <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <span>
              <span className="font-medium">{m.displayName}</span>{" "}
              <span className="text-sm text-muted">
                · {m.role}
                {m.department ? ` · ${m.department.name}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-semibold">Pending invites ({invites.length})</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
            {invites.map((i) => (
              <li key={i.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{i.email}</span> <span className="text-muted">· {i.role} · pending</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
