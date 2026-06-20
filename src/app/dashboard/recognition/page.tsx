import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { kudosRemainingFor, companyRecognitionFeed } from "@/lib/coins";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { RecognitionForms } from "./RecognitionForms";

export const dynamic = "force-dynamic";

export default async function RecognitionPage() {
  const m = await requireMembership();
  const isAdmin = m.role === "ADMIN" || m.role === "HR";

  const [colleagues, remaining, feed] = await Promise.all([
    prisma.employeeProfile.findMany({
      where: { companyId: m.companyId, id: { not: m.id } },
      select: { id: true, displayName: true, role: true },
      orderBy: { displayName: "asc" },
    }),
    kudosRemainingFor(m.id, m.kudosMonthlyAllowance),
    companyRecognitionFeed(m.companyId),
  ]);

  // Did this member earn an Employee-of-the-Month style company grant? Surface it in the lime banner.
  const award = feed.find((t) => t.kind === "GRANT" && t.toEmployeeId === m.id);

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">Recognition</div>
          <h1>Give someone their flowers</h1>
        </div>
        <Mascot mood="love" size={58} className="float" />
      </div>

      {award && (
        <div className="eom mt-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/30"><Icon name="medal" size={26} className="text-[#5c6b14]" /></span>
          <div>
            <div className="kicker !text-[#5c6b14]">Employee of the month</div>
            <div className="font-display text-xl font-extrabold">You earned +{award.amount} coins!</div>
            <div className="text-[13px]">{award.memo || "Nominated by your team"}</div>
          </div>
        </div>
      )}

      <RecognitionForms colleagues={colleagues} remaining={remaining} isAdmin={isAdmin} />

      <div className="sec"><h3>Recognition wall</h3></div>
      {feed.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
          No recognition yet. Be the first to call out great work.
        </p>
      ) : (
        <div>
          {feed.map((t) => {
            const fromName = t.kind === "GRANT" ? "Company" : t.from?.displayName ?? "Someone";
            const toName = t.to?.displayName ?? "Someone";
            return (
              <div key={t.id} className="row mb-2.5 flex-col items-stretch !gap-1.5">
                <div className="flex items-center gap-2">
                  {t.kind === "GRANT" ? (
                    <span className="ico coral shrink-0"><Icon name="trophy" size={20} /></span>
                  ) : (
                    <Avatar name={fromName} seed={t.fromEmployeeId ?? fromName} size={42} className="shrink-0" />
                  )}
                  <p className="grow text-sm">
                    <span className="font-semibold">{fromName}</span>
                    <span className="text-muted"> → </span>
                    <span className="font-semibold">{toName}</span>
                  </p>
                  <span className="coin sm shrink-0">+{t.amount}</span>
                </div>
                {t.memo && <p className="pl-[54px] text-sm text-ink-soft">“{t.memo}”</p>}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
