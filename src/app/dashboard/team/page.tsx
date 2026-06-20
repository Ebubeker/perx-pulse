import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { CreateTeamPack, JoinLeaveButton } from "./TeamForms";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const m = await requireMembership();

  const packs = await prisma.teamPack.findMany({
    where: { companyId: m.companyId },
    include: {
      creator: { select: { displayName: true } },
      members: { select: { employeeProfileId: true, employee: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-primary">TEAM PACKS</p>
      <h1 className="text-2xl font-bold">Do perks together</h1>
      <p className="mt-1 text-sm text-muted">Open a group activity and rally your colleagues.</p>

      <div className="mt-5">
        <CreateTeamPack />
      </div>

      <div className="mt-6 space-y-4">
        {packs.length === 0 && (
          <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No team packs yet. Start the first one!</p>
        )}
        {packs.map((pk) => {
          const joined = pk.members.some((mem) => mem.employeeProfileId === m.id);
          const count = pk.members.length;
          const full = count >= pk.targetSize;
          const pct = Math.min(100, Math.round((count / pk.targetSize) * 100));
          return (
            <div key={pk.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{pk.title}</h2>
                  <p className="text-xs text-muted">by {pk.creator.displayName}</p>
                </div>
                <JoinLeaveButton teamPackId={pk.id} joined={joined} full={full} />
              </div>
              {pk.description && <p className="mt-2 text-sm text-ink-soft">{pk.description}</p>}
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span className="font-semibold">{count} / {pk.targetSize} joined</span>
                {full && <span className="font-bold text-primary">Locked in 🎉</span>}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 truncate text-xs text-muted">{pk.members.map((mem) => mem.employee.displayName).join(", ")}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
