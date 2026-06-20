import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { Mascot } from "@/components/Mascot";
import { passportFor, ALL_CATEGORIES } from "@/lib/passport";

export const dynamic = "force-dynamic";

const DISC = [
  { bg: "var(--coral)", color: "#fff" },
  { bg: "var(--lime)", color: "var(--ink)" },
  { bg: "var(--ink)", color: "#fff" },
] as const;

export default async function PassportPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const collected = await passportFor(m.id);
  const have = ALL_CATEGORIES.filter((c) => collected.has(c.key)).length;
  const pct = Math.round((have / ALL_CATEGORIES.length) * 100);

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* heading + mascot */}
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Your year so far</div>
          <h1>Passport</h1>
        </div>
        <Mascot mood="cool" size={58} />
      </div>

      {/* recap hero */}
      <div className="recap relative mt-3 overflow-hidden rounded-[var(--r-xl)] bg-coral p-[22px] text-white">
        <h1 className="max-w-[70%] font-display text-[26px] font-bold tracking-[-0.02em]">{have === ALL_CATEGORIES.length ? "Full passport!" : "Your benefit journey"}</h1>
        <p className="mt-2 text-sm text-white/90">Collect a stamp for every kind of perk you try.</p>
        <div className="mt-4 flex items-baseline justify-between text-sm font-semibold">
          <span>{have} / {ALL_CATEGORIES.length} explored</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="sec"><h3>Stamps</h3><span className="link">{have} / {ALL_CATEGORIES.length} collected</span></div>
      <div className="stamp-grid">
        {ALL_CATEGORIES.map((c, i) => {
          const got = collected.has(c.key);
          const disc = DISC[i % DISC.length]!;
          return (
            <Link key={c.key} href={`/dashboard/employee?cat=${c.key}#browse`} className={`stamp ${got ? "got" : "lock"}`}>
              <div className="disc" style={got ? { background: disc.bg, color: disc.color } : undefined}>{got ? c.emoji : "🔒"}</div>
              <div className="nm">{c.label}</div>
            </Link>
          );
        })}
      </div>

      {have === ALL_CATEGORIES.length && (
        <div className="card mt-4 flex items-center gap-3 border-[#E3EBBE] bg-lime-soft">
          <Mascot mood="celebrate" size={44} />
          <div className="text-sm font-semibold">🎉 Full passport! You&apos;re a Perx explorer.</div>
        </div>
      )}
    </main>
  );
}
