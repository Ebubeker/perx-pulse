import { requireMembership } from "@/lib/account";
import { topEarners, topGivers, type Ranked } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

function Board({ title, subtitle, rows, unit, meId }: { title: string; subtitle: string; rows: Ranked[]; unit: string; meId: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-muted">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No activity yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.id} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${r.id === meId ? "bg-primary-soft" : ""}`}>
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-6 text-center text-sm">{MEDALS[i] ?? i + 1}</span>
                <span className="truncate text-sm font-medium">{r.name}{r.id === meId ? " (you)" : ""}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-gold-ink">{r.value.toLocaleString("en-US")} {unit}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const m = await requireMembership();
  const [earners, givers] = await Promise.all([topEarners(m.companyId), topGivers(m.companyId)]);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-gold-ink">LEADERBOARD</p>
      <h1 className="text-2xl font-bold">{m.company.brandName || m.company.name}</h1>

      <div className="mt-6 space-y-4">
        <Board title="Most recognized 🏆" subtitle="Coins earned all-time" rows={earners} unit="coins" meId={m.id} />
        <Board title="Most generous 💛" subtitle="Kudos given this month" rows={givers} unit="given" meId={m.id} />
      </div>
    </main>
  );
}
