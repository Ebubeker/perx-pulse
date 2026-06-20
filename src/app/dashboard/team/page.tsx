import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { CreateTeamPack, JoinLeaveButton } from "./TeamForms";

export const dynamic = "force-dynamic";

const PACK_TOP = ["lime", "coral", "ink"] as const;

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
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="team" size={13} />Team Packs</div>
          <h1>Do perks together</h1>
        </div>
        <Mascot mood="headphones" size={60} className="float" />
      </div>
      <p className="mt-1 px-0.5 text-sm text-muted">Pool budgets with coworkers for something bigger.</p>

      <div className="mt-4">
        <CreateTeamPack />
      </div>

      <div className="mt-5 space-y-4">
        {packs.length === 0 && (
          <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No team packs yet. Start the first one!</p>
        )}
        {packs.map((pk, i) => {
          const joined = pk.members.some((mem) => mem.employeeProfileId === m.id);
          const count = pk.members.length;
          const full = count >= pk.targetSize;
          const pct = Math.min(100, Math.round((count / pk.targetSize) * 100));
          const top = PACK_TOP[i % PACK_TOP.length];
          const shown = pk.members.slice(0, 6);
          return (
            <div key={pk.id} className="pack">
              <div className={`pack-top ${top}`}>
                <div className="kk">Team pack · by {pk.creator.displayName}</div>
                <h2>{pk.title}</h2>
              </div>
              <div className="pack-body">
                <div className="why">
                  <span className="spark"><Icon name="sparkles" size={18} /></span>
                  <span>{pk.description ? pk.description : `${count} of ${pk.targetSize} joined${full ? " — locked in!" : " — unlocks a group rate."}`}</span>
                </div>

                {/* Stacked illustrated members (.joined) — overlapping <Avatar size={34}> + +N */}
                {shown.length > 0 ? (
                  <div className="joined">
                    {shown.map((mem) => (
                      <Avatar key={mem.employeeProfileId} name={mem.employee.displayName} seed={mem.employeeProfileId} size={34} />
                    ))}
                    {count > shown.length && (
                      <span className="grid h-[34px] w-[34px] place-items-center bg-line text-xs font-bold text-muted">
                        +{count - shown.length}
                      </span>
                    )}
                    <span className="ml-2.5 self-center !border-0 text-[13px] text-muted">joined</span>
                  </div>
                ) : (
                  <p className="mt-2.5 text-sm text-muted">No one yet — be first</p>
                )}

                <div className={`bar mt-3.5 ${full ? "coral" : ""}`}><i style={{ width: `${pct}%` }} /></div>
                <div className="pack-foot">
                  <span className="muted text-[13px]">{count} / {pk.targetSize} joined{full ? " · locked in" : ""}</span>
                  <JoinLeaveButton teamPackId={pk.id} joined={joined} full={full} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
