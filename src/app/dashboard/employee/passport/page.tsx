import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { passportFor, ALL_CATEGORIES } from "@/lib/passport";

export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const collected = await passportFor(m.id);
  const have = ALL_CATEGORIES.filter((c) => collected.has(c.key)).length;
  const pct = Math.round((have / ALL_CATEGORIES.length) * 100);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="mt-1 text-sm font-semibold tracking-wide text-violet">PERX PASSPORT</p>
      <h1 className="text-2xl font-bold">Your benefit journey</h1>
      <p className="mt-1 text-sm text-muted">Collect a stamp for every kind of perk you try.</p>

      <div className="mt-5 rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{have} / {ALL_CATEGORIES.length} explored</span>
          <span className="text-sm font-bold text-violet">{pct}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cream">
          <div className="h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {ALL_CATEGORIES.map((c) => {
          const got = collected.has(c.key);
          return (
            <div
              key={c.key}
              className={`flex flex-col items-center rounded-2xl border p-5 text-center ${got ? "border-violet/40 bg-violet-soft" : "border-dashed border-line bg-paper"}`}
            >
              <span className={`text-3xl ${got ? "" : "opacity-25 grayscale"}`}>{c.emoji}</span>
              <span className={`mt-2 text-sm font-semibold ${got ? "text-violet" : "text-muted"}`}>{c.label}</span>
              <span className="mt-0.5 text-xs text-muted">{got ? "Stamped ✓" : "Locked"}</span>
            </div>
          );
        })}
      </div>

      {have === ALL_CATEGORIES.length && (
        <p className="mt-5 rounded-xl border border-violet/30 bg-violet-soft px-4 py-3 text-center text-sm font-semibold text-violet">
          🎉 Full passport! You&apos;re a Perx explorer.
        </p>
      )}
    </main>
  );
}
