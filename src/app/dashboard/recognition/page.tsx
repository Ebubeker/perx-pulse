import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { kudosRemainingFor, companyRecognitionFeed } from "@/lib/coins";
import { Mascot } from "@/components/Mascot";
import { Coins } from "@/components/Coins";
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

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="greet">
          <div className="day">PerxCoin · Recognition</div>
          <h1>Give someone their flowers</h1>
        </div>
        <Mascot mood="love" size={62} className="float" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="stat">
          <div className="k">Your coins</div>
          <div className="v text-coral"><Coins amount={m.recognitionCoins} /></div>
        </div>
        <div className="stat">
          <div className="k">To give this month</div>
          <div className="v"><Coins amount={remaining} /></div>
        </div>
      </div>

      <RecognitionForms colleagues={colleagues} remaining={remaining} isAdmin={isAdmin} />

      <div className="sec"><h3>Recognition wall</h3></div>
      {feed.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
          No recognition yet. Be the first to call out great work.
        </p>
      ) : (
        <div>
          {feed.map((t) => (
            <div key={t.id} className="row mb-2.5 flex-col items-stretch !gap-1.5">
              <div className="flex items-center gap-2">
                <span className="ico coral shrink-0">{t.kind === "GRANT" ? "🏆" : "🙌"}</span>
                <p className="grow text-sm">
                  <span className="font-semibold">{t.kind === "GRANT" ? "Company" : t.from?.displayName ?? "Someone"}</span>
                  <span className="text-muted"> → </span>
                  <span className="font-semibold">{t.to?.displayName ?? "Someone"}</span>
                </p>
                <span className="coin sm shrink-0">+{t.amount}</span>
              </div>
              {t.memo && <p className="pl-[54px] text-sm text-ink-soft">“{t.memo}”</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
