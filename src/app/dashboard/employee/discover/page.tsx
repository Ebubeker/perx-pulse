import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { resolveOffers } from "@/lib/gemini";
import { ChooseButton } from "./ChooseButton";

export const dynamic = "force-dynamic";

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
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold">Nothing here yet</h1>
        <p className="mt-2 text-sm text-muted">Take this week&apos;s Pulse and Perx will build perk packs for you.</p>
        <Link href="/dashboard/employee/pulse" className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-white">Take the Pulse</Link>
      </main>
    );
  }

  const withItems = await Promise.all(recs.map(async (rec) => ({ rec, items: await resolveOffers(rec.itemOfferIds) })));

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm font-semibold tracking-wide text-violet">DISCOVER WEEKLY · AI-picked</p>
      <h1 className="mt-1 text-2xl font-bold">Built for your week</h1>
      <p className="mt-1 text-sm text-muted">From local providers, inside your budget.</p>

      <div className="mt-6 space-y-5">
        {withItems.map(({ rec, items }) => {
          const taxFree = items.length > 0 && items.every((o) => o.taxFree);
          return (
            <div key={rec.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{rec.label}</h2>
                <span className="font-bold">{rec.totalLek.toLocaleString("en-US")} L</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{rec.rationale}</p>

              <ul className="mt-3 space-y-2">
                {items.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium">{o.title}</span>{" "}
                      <span className="text-muted">· {o.providerName}{o.area ? ` · ${o.area}` : ""}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink-soft">{o.priceLek.toLocaleString("en-US")} L</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center gap-2">
                {taxFree && <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">Tax-free</span>}
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-muted">{items.length} providers</span>
              </div>

              <div className="mt-4">
                <ChooseButton recId={rec.id} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard/employee/pulse" className="text-sm font-semibold text-muted">Retake the Pulse</Link>
      </div>
    </main>
  );
}
