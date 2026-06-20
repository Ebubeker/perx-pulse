import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { setDropActive } from "@/lib/drop-actions";
import { DropForm } from "./DropForm";

export const dynamic = "force-dynamic";

function endsIn(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  return h >= 24 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.floor(ms / 60000)}m left`;
}

export default async function ProviderDropsPage() {
  const p = await requireProvider();
  const drops = await prisma.drop.findMany({
    where: { providerId: p.id },
    include: { claims: { include: { employee: { select: { displayName: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="mt-1 text-sm font-semibold tracking-wide text-accent">DROPS</p>
      <h1 className="text-2xl font-bold">Flash perks</h1>
      <p className="mt-1 text-sm text-muted">Fill dead capacity. Employees claim instantly with their PerxCoins — pure demand, zero CAC.</p>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-semibold">New drop</h2>
        <DropForm defaultCategory={p.category} />
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Your drops ({drops.length})</h2>
      {drops.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No drops yet.</p>
      ) : (
        <ul className="space-y-3">
          {drops.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-semibold">{d.title} {!d.active && <span className="text-xs text-muted">(hidden)</span>}</span>
                <span className="shrink-0 text-sm font-bold text-gold-ink">{d.costCoins} coins</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {d.claimedSlots}/{d.totalSlots} claimed · {endsIn(d.endsAt)} · {d.category}
              </p>
              {d.claims.length > 0 && (
                <p className="mt-2 text-xs text-ink-soft">
                  Claimed by {d.claims.map((c) => c.employee.displayName).join(", ")}
                </p>
              )}
              <form action={setDropActive.bind(null, d.id, !d.active)} className="mt-2">
                <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">{d.active ? "Hide" : "Show"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
