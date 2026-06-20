import { requireMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { kudosRemainingFor, companyRecognitionFeed } from "@/lib/coins";
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
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-gold-ink">PERXCOIN · RECOGNITION</p>
      <h1 className="text-2xl font-bold">Give someone their flowers</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-gold-ink">{m.recognitionCoins.toLocaleString("en-US")}</p>
          <p className="text-xs text-muted">your coins</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{remaining.toLocaleString("en-US")}</p>
          <p className="text-xs text-muted">to give this month</p>
        </div>
      </div>

      <RecognitionForms colleagues={colleagues} remaining={remaining} isAdmin={isAdmin} />

      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">Recognition wall</h2>
      {feed.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
          No recognition yet. Be the first to call out great work.
        </p>
      ) : (
        <ul className="space-y-2">
          {feed.map((t) => (
            <li key={t.id} className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="text-sm">
                <span className="font-semibold">{t.kind === "GRANT" ? "🏆 Company" : t.from?.displayName ?? "Someone"}</span>
                <span className="text-muted"> → </span>
                <span className="font-semibold">{t.to?.displayName ?? "Someone"}</span>
                <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-bold text-gold-ink">+{t.amount}</span>
              </p>
              {t.memo && <p className="mt-1 text-sm text-ink-soft">“{t.memo}”</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
