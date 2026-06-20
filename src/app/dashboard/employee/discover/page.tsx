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
import { ChooseButton } from "./ChooseButton";

export const dynamic = "force-dynamic";

const PACK_TOP = ["coral", "lime", "ink"] as const;
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

      {/* mode button — re-tune the packs via the Pulse */}
      <Link
        href="/dashboard/employee/pulse"
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2.5 text-[13px] font-bold shadow-soft"
      >
        <Icon name="settings" size={15} /> Mode: {modeLabel}
        <Icon name="chevronRight" size={14} className="rotate-90 text-muted" />
      </Link>

      <div className="mt-4 space-y-4">
        {withItems.map(({ rec, items }, i) => {
          const top = PACK_TOP[i % PACK_TOP.length];
          const taxFree = items.length > 0 && items.every((o) => o.taxFree);
          const packImg = PACK_IMG[i % PACK_IMG.length];
          return (
            <div key={rec.id} className="pack fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className={`pack-top ${top} flex items-center justify-between gap-3.5`}>
                <div className="min-w-0">
                  <div className="kk">AI Pick · {items.length} providers</div>
                  <h2 className="truncate">{rec.label}</h2>
                </div>
                <Image
                  src={`/perx/packs/${packImg}.png`}
                  alt=""
                  width={70}
                  height={96}
                  unoptimized
                  className="float h-24 w-[70px] shrink-0 rounded-[13px] object-cover shadow-[0_8px_18px_rgba(0,0,0,.18)]"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              </div>
              <div className="pack-body">
                <div className="why"><span className="spark"><Icon name="sparkles" size={15} /></span><span>{rec.rationale}</span></div>
                <div className="chip-row mb-3.5">
                  {items.map((o) => (
                    <Link key={o.id} href={`/dashboard/employee/offer/${o.id}`} className="provchip">{o.providerName}</Link>
                  ))}
                </div>
                <div className="pack-foot">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{items.length} providers</span>
                    {taxFree && <span className="badge badge-tax">Tax-free</span>}
                    <span className="price"><Coins amount={toCoins(rec.totalLek)} /></span>
                  </div>
                  <ChooseButton recId={rec.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ask Perx Genie */}
      <Link href="/dashboard/employee/genie" className="row mt-4 mb-0">
        <span className="ico coral"><Icon name="sparkles" size={20} /></span>
        <div className="grow"><div className="t">Ask Perx Genie</div><div className="s">&ldquo;I have 3,000 L and I&apos;m exhausted&rdquo;</div></div>
        <span className="text-coral">→</span>
      </Link>

      <div className="mt-5 text-center">
        <Link href="/dashboard/employee/pulse" className="text-sm font-semibold text-muted">Retake the Pulse →</Link>
      </div>
    </main>
  );
}
