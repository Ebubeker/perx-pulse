import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { toCoins } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { ChoosePackCard } from "./ChoosePackCard";

export const dynamic = "force-dynamic";

const PACK_IMG = ["pack-sleepy", "pack-excited", "pack-mischief", "pack-love", "pack-happy", "pack-cool"] as const;
const MODE_LABEL: Record<string, string> = {
  SPEND_ALL: "Spend for me",
  SAVE_SOME: "Save some",
  TREAT_MYSELF: "Treat myself",
  TEAM: "Team mode",
};

export default async function DiscoverPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const latestPulse = await prisma.pulse.findFirst({
    where: { employeeProfileId: m.id },
    orderBy: { createdAt: "desc" },
    include: { recommendations: { orderBy: { createdAt: "asc" } } },
  });
  const recs = latestPulse?.recommendations ?? [];

  if (!recs.length) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Mascot mood="thinking" size={120} className="float" />
        <h1 className="mt-5 font-display text-xl font-bold">Nothing here yet</h1>
        <p className="mt-2 text-sm text-muted">Take this week&apos;s Pulse and Perx will build perk packs for you.</p>
        <Link href="/dashboard/employee/pulse" className="btn btn-primary mt-5">Take the Pulse</Link>
      </main>
    );
  }

  const withItems = await Promise.all(recs.map(async (rec) => ({ rec, items: await resolveOffers(rec.itemOfferIds) })));
  const modeLabel = MODE_LABEL[latestPulse?.budgetMode ?? "SPEND_ALL"] ?? "Spend for me";

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* header + mascot */}
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day flex items-center gap-1.5"><Icon name="sparkles" size={13} />Discover Weekly</div>
          <h1>Built for your week</h1>
        </div>
        <Mascot mood="excited" size={58} className="float" />
      </div>
      <p className="mt-1 text-sm text-muted">Built for your pulse. Pick one, swap anything.</p>

      {/* .modebtn mode pill — re-tune the packs via the Pulse */}
      <Link href="/dashboard/employee/pulse" className="modebtn mt-2">
        <Icon name="settings" size={15} /> Mode: {modeLabel}
        <Icon name="chevronRight" size={14} className="rotate-90 text-muted" />
      </Link>

      {/* same image-card carousel as the home Discover Weekly */}
      <div className="hscroll mt-4">
        {withItems.map(({ rec, items }, i) => {
          const packImg = PACK_IMG[i % PACK_IMG.length];
          return (
            <ChoosePackCard key={rec.id} recId={rec.id} className="relative block h-[320px] w-[248px] overflow-hidden rounded-xl md:w-[268px]">
              <Image src={`/perx/packs/${packImg}.png`} alt="" fill sizes="268px" unoptimized className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <span className="absolute right-3 top-3 z-[2] inline-flex items-center rounded-full bg-coral px-3 py-1.5 font-display text-sm font-bold text-white shadow-[var(--sh-press)]">
                <Coins amount={toCoins(rec.totalLek)} />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="font-mono text-[10px] uppercase tracking-[.16em] text-white/75">AI Pick · {items.length} providers</div>
                <h2 className="mt-0.5 font-display text-[22px] font-bold leading-tight">{rec.label}</h2>
              </div>
            </ChoosePackCard>
          );
        })}
      </div>

      {/* Ask Perx Genie */}
      <Link href="/dashboard/employee/genie" className="row mt-4 mb-0">
        <span className="ico coral"><Icon name="sparkles" size={20} /></span>
        <div className="grow"><div className="t">Ask Perx Genie</div><div className="s">&ldquo;I have 3,000 L and I&apos;m exhausted&rdquo;</div></div>
        <span className="text-coral">→</span>
      </Link>

      <div className="mt-6 space-y-2.5 text-center">
        <Link href="/dashboard/employee" className="btn btn-soft btn-lg w-full">← Back to dashboard</Link>
        <Link href="/dashboard/employee/pulse" className="block text-sm font-semibold text-muted">Retake the Pulse →</Link>
      </div>
    </main>
  );
}
