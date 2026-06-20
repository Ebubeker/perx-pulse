import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { AddOfferButton } from "./AddOfferButton";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Food", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
};

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const offer = await prisma.offer.findFirst({ where: { id, active: true }, include: { provider: true } });
  if (!offer) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">
        This offer isn&apos;t available. <Link href="/dashboard/employee" className="font-semibold text-coral underline">Back to perks</Link>
      </main>
    );
  }

  const p = offer.provider;
  const more = await prisma.offer.findMany({
    where: { providerId: offer.providerId, active: true, id: { not: offer.id } },
    orderBy: { priceLek: "asc" },
    take: 4,
  });
  const hours = p.openingHours && typeof p.openingHours === "object" && !Array.isArray(p.openingHours)
    ? Object.entries(p.openingHours as Record<string, unknown>).map(([k, v]) => [k, String(v)] as const)
    : [];

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* hero header */}
      <div className="pack">
        <div className="pack-top coral">
          <div className="kk">{CAT_LABEL[offer.category] ?? offer.category}{offer.area ? ` · ${offer.area}` : ""}</div>
          <h2>{offer.title}</h2>
        </div>
        <div className="pack-body">
          <p className="text-sm text-muted">
            <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="font-semibold text-ink underline-offset-2 hover:underline">{p.businessName}</Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="font-display text-3xl font-bold text-ink"><Coins amount={toCoins(effectiveLek(offer.priceLek, offer.discountPct))} /></span>
            {offer.discountPct > 0 && (
              <>
                <Coins amount={toCoins(offer.priceLek)} strike className="text-base" />
                <span className="badge badge-new">−{offer.discountPct}%</span>
              </>
            )}
            {offer.taxFree && <span className="badge badge-tax">Tax-free</span>}
          </div>
        </div>
      </div>

      {/* what you get */}
      <div className="card mt-4">
        <div className="kicker">What you get</div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          {offer.description || "The provider hasn't added a description for this perk yet — tap below to add it to a pack and your HR will see the details on the voucher."}
        </p>
      </div>

      {/* add to pack */}
      <div className="mt-4">
        <AddOfferButton offerId={offer.id} />
        <p className="mt-2 text-center text-xs text-muted">Adds to a pack you can send to HR. Fully employer-funded.</p>
      </div>

      {/* Provider */}
      <div className="card mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold">About {p.businessName}</h2>
          <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="shrink-0 text-sm font-semibold text-coral">View profile →</Link>
        </div>
        {p.description && <p className="mt-1.5 text-sm text-ink-soft">{p.description}</p>}
        <dl className="mt-3 space-y-1.5 text-sm">
          {(p.addressLine || p.city) && (
            <div className="flex gap-2"><dt className="text-muted">📍</dt><dd>{[p.addressLine, p.city].filter(Boolean).join(", ")}</dd></div>
          )}
          {p.areasServed.length > 0 && (
            <div className="flex gap-2"><dt className="text-muted">🗺️</dt><dd>{p.areasServed.join(" · ")}</dd></div>
          )}
          {p.contactPhone && (
            <div className="flex gap-2"><dt className="text-muted">📞</dt><dd>{p.contactPhone}</dd></div>
          )}
        </dl>
        {hours.length > 0 && (
          <div className="mt-3">
            <p className="kicker">Hours</p>
            <ul className="mt-1.5 space-y-0.5 text-sm">
              {hours.map(([day, val]) => (
                <li key={day} className="flex justify-between"><span className="capitalize text-muted">{day}</span><span>{val}</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {more.length > 0 && (
        <div className="mt-6">
          <div className="sec"><h3>More from {p.businessName}</h3></div>
          <ul className="space-y-2.5">
            {more.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/employee/offer/${o.id}`} className="row mb-0">
                  <span className="ico coral">✦</span>
                  <div className="grow"><div className="t truncate">{o.title}</div><div className="s">{CAT_LABEL[o.category] ?? o.category}</div></div>
                  <span className="amt"><Coins amount={toCoins(effectiveLek(o.priceLek, o.discountPct))} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
