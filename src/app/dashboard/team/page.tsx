import Image from "next/image";
import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { CreateTeamPack, JoinLeaveButton } from "./TeamForms";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const m = await requireMembership();

  const [packs, catalog] = await Promise.all([
    prisma.teamPack.findMany({
      where: { companyId: m.companyId },
      include: {
        creator: { select: { displayName: true } },
        offer: { select: { title: true, imageUrl: true } },
        members: { select: { employeeProfileId: true, employee: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCatalog(),
  ]);
  const offerChoices = catalog.map((o) => ({ id: o.id, title: o.title, providerName: o.providerName, coins: toCoins(o.effLek) }));

  return (
    <main className="mx-auto max-w-md px-5 py-5 md:max-w-5xl md:px-8 md:py-7">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="team" size={13} />Team Packs</div>
          <h1>Do perks together</h1>
        </div>
        <Mascot mood="headphones" size={60} className="float" />
      </div>
      <p className="mt-1 px-0.5 text-sm text-muted">Pool up with coworkers — fill a group and <b className="text-ink">everyone earns bonus coins</b> you don&apos;t get on your own.</p>

      <div className="mt-4 md:max-w-xl">
        <CreateTeamPack offers={offerChoices} />
      </div>

      {packs.length === 0 ? (
        <p className="mt-5 rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No team packs yet. Start the first one!</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((pk) => {
            const joined = pk.members.some((mem) => mem.employeeProfileId === m.id);
            const count = pk.members.length;
            const full = count >= pk.targetSize;
            const locked = !!pk.lockedAt;
            const pct = Math.min(100, Math.round((count / pk.targetSize) * 100));
            const shown = pk.members.slice(0, 6);
            const img = pk.offer?.imageUrl ?? null;
            return (
              <div key={pk.id} className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-line bg-paper shadow-[var(--sh-1)]">
                {/* hero */}
                <div className="relative h-36 w-full overflow-hidden bg-coral">
                  {img && <Image src={img} alt="" fill sizes="(min-width:1024px) 340px, (min-width:768px) 50vw, 100vw" unoptimized className="object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                  <div className="coupon-tex pointer-events-none absolute inset-0" />
                  {locked && (
                    <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                      <Icon name="check" size={12} strokeWidth={3} /> Locked in
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 z-[2] p-4 text-white">
                    <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/75">Team pack · by {pk.creator.displayName}</div>
                    <h2 className="font-display text-lg font-bold leading-tight">{pk.title}</h2>
                  </div>
                </div>

                {/* body */}
                <div className="flex grow flex-col p-4">
                  {pk.description && <p className="text-sm text-ink-soft">{pk.description}</p>}

                  {/* group bonus highlight — the perk you don't get solo */}
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-lime-soft px-3 py-2 text-[13px] font-semibold text-gold-ink">
                    <Icon name="gift" size={16} className="shrink-0" />
                    {locked ? <span>Everyone earned +{pk.bonusCoins} bonus coins!</span> : <span>+{pk.bonusCoins} coins each when {pk.targetSize} join</span>}
                  </div>

                  {/* members */}
                  <div className="mt-3 flex items-center gap-2">
                    {shown.length > 0 ? (
                      <>
                        <div className="flex -space-x-2">
                          {shown.map((mem) => (
                            <Avatar key={mem.employeeProfileId} name={mem.employee.displayName} seed={mem.employeeProfileId} size={30} className="ring-2 ring-paper" />
                          ))}
                          {count > shown.length && (
                            <span className="grid size-[30px] place-items-center rounded-full bg-cream text-[11px] font-bold text-muted ring-2 ring-paper">+{count - shown.length}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted">{count} joined</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted">No one yet — be first</span>
                    )}
                  </div>

                  <div className={`bar mt-3 ${full ? "coral" : ""}`}><i style={{ width: `${pct}%` }} /></div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="text-[13px] text-muted">{count} / {pk.targetSize}{locked ? " · locked in" : full ? " · full" : ""}</span>
                    <JoinLeaveButton teamPackId={pk.id} joined={joined} full={full} locked={locked} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
