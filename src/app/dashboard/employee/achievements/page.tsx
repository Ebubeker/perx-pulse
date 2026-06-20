import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { passportFor, ALL_CATEGORIES } from "@/lib/passport";
import { prisma } from "@/lib/prisma";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const AWARD_NAME: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Foodie", health: "Health",
  learning: "Learning", culture: "Culture", travel: "Travel", telecom: "Telecom",
};

export default async function AchievementsPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const [collected, perks, claims] = await Promise.all([
    passportFor(m.id),
    prisma.order.count({ where: { employeeProfileId: m.id } }),
    prisma.dropClaim.count({ where: { employeeProfileId: m.id } }),
  ]);
  const have = ALL_CATEGORIES.filter((c) => collected.has(c.key)).length;
  const total = ALL_CATEGORIES.length;
  const pct = Math.round((have / total) * 100);

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Your trophy case</div>
          <h1>Achievements</h1>
        </div>
        <Mascot mood={have === total ? "celebrate" : "cool"} size={58} className="float" />
      </div>

      {/* progress hero */}
      <div className="card-dark mt-3">
        <div className="blob" />
        <div className="relative z-[2]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="kicker text-[var(--txt-on-dark-mut)]">Awards unlocked</div>
              <div className="font-display text-[40px] font-bold leading-none text-[var(--txt-on-dark)]">{have}<span className="text-2xl text-[var(--txt-on-dark-mut)]">/{total}</span></div>
            </div>
            <div className="text-right text-[13px] text-[var(--txt-on-dark-mut)]">{perks + claims} perks enjoyed</div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="sec"><h3>Category awards</h3><span className="link">{have} / {total}</span></div>
      <div className="stamp-grid">
        {ALL_CATEGORIES.map((c) => {
          const got = collected.has(c.key);
          return (
            <Link key={c.key} href={`/dashboard/employee?cat=${c.key}#browse`} className={`astamp ${got ? "" : "lock"}`}>
              <Image src={`/perx/awards/award-${c.key}.png`} alt={AWARD_NAME[c.key] ?? c.label} width={104} height={104} unoptimized />
              <div className="nm">{AWARD_NAME[c.key] ?? c.label}{!got && <Icon name="lock" size={11} />}</div>
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[13px] text-muted">
        {have === total
          ? "Every award unlocked — you're a true Perx explorer."
          : <>Try a perk from a new category to unlock its award — <b>{total - have}</b> to go.</>}
      </p>

      <Link href="/dashboard/employee/passport" className="row mt-4 mb-0">
        <span className="ico coral"><Icon name="passport" size={20} /></span>
        <div className="grow"><div className="t">Your Passport</div><div className="s">Year recap &amp; the businesses you supported</div></div>
        <span className="text-coral">→</span>
      </Link>
    </main>
  );
}
