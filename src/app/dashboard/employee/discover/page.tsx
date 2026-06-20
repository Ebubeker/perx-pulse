import Link from "next/link";
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

      <div className="mt-5 space-y-4">
        {withItems.map(({ rec, items }, i) => {
          const top = PACK_TOP[i % PACK_TOP.length];
          const taxFree = items.length > 0 && items.every((o) => o.taxFree);
          return (
            <div key={rec.id} className="pack fade-up">
              <div className={`pack-top ${top}`}>
                <div className="kk">AI Pick · {items.length} providers</div>
                <h2>{rec.label}</h2>
              </div>
              <div className="pack-body">
                <div className="why"><span className="spark">✦</span><span>{rec.rationale}</span></div>
                <ul className="space-y-1.5">
                  {items.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/dashboard/employee/offer/${o.id}`} className="min-w-0 truncate">
                        <span className="font-medium underline-offset-2 hover:underline">{o.title}</span>{" "}
                        <span className="text-muted">· {o.providerName}{o.area ? ` · ${o.area}` : ""}</span>
                      </Link>
                      <span className="shrink-0 font-semibold text-ink-soft"><Coins amount={toCoins(o.effLek)} /></span>
                    </li>
                  ))}
                </ul>
                <div className="pack-foot">
                  <div className="flex items-center gap-2">
                    <span className="price"><Coins amount={toCoins(rec.totalLek)} /></span>
                    {taxFree && <span className="badge badge-tax">Tax-free</span>}
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
