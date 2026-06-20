import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon, type IconName } from "@/components/Icon";
import { AddOfferButton } from "./AddOfferButton";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Food", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
};
const CAT_ICON: Record<string, IconName> = {
  wellness: "wellness", fitness: "fitness", food: "food", health: "health",
  travel: "travel", learning: "learning", culture: "culture", telecom: "telecom",
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
  const effLek = effectiveLek(offer.priceLek, offer.discountPct);
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
      {/* ── Product hero ── */}
      <div className="pack">
        {offer.imageUrl ? (
          <div className="relative h-56 w-full overflow-hidden">
            <Image src={offer.imageUrl} alt="" fill sizes="448px" unoptimized priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="font-mono text-[11px] uppercase tracking-[.16em] text-white/80">{CAT_LABEL[offer.category] ?? offer.category}{offer.area ? ` · ${offer.area}` : ""}</div>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{offer.title}</h2>
            </div>
          </div>
        ) : (
          <div className="pack-top coral">
            <div className="kk">{CAT_LABEL[offer.category] ?? offer.category}{offer.area ? ` · ${offer.area}` : ""}</div>
            <h2>{offer.title}</h2>
          </div>
        )}
        <div className="pack-body">
          <p className="text-sm text-muted">
            <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="font-semibold text-ink underline-offset-2 hover:underline">
              {p.businessName}
            </Link>
            {p.city ? ` · ${p.city}` : ""}
          </p>

          {/* price line */}
          <div className="pack-foot">
            <div className="flex flex-wrap items-center gap-2">
              {offer.taxFree && <span className="badge badge-tax">Tax-free</span>}
              {offer.discountPct > 0 && <span className="badge badge-new">−{offer.discountPct}%</span>}
            </div>
            <div className="flex items-baseline gap-2">
              {offer.discountPct > 0 && <Coins amount={toCoins(offer.priceLek)} strike className="text-sm" />}
              <span className="price text-coral"><Coins amount={toCoins(effLek)} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── What you get ── */}
      <div className="card mt-4">
        <div className="kicker">What you get</div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          {offer.description || "The provider hasn't added a description for this perk yet — tap below to add it to a pack and your HR will see the details on the voucher."}
        </p>
      </div>

      {/* ── Add to pack ── */}
      <div className="mt-4">
        <AddOfferButton offerId={offer.id} />
        <p className="mt-2 text-center text-xs text-muted">Adds to a pack you can send to HR. Fully employer-funded · the money never touches your hands.</p>
      </div>

      {/* ── About the provider ── */}
      <div className="card mt-6">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-coral-soft text-coral-deep">
            <Icon name={CAT_ICON[p.category] ?? "store"} size={24} />
          </span>
          <div className="min-w-0 grow">
            <h2 className="truncate font-display text-base font-bold">{p.businessName}</h2>
            <div className="text-[12.5px] text-muted">{CAT_LABEL[p.category] ?? p.category}{p.city ? ` · ${p.city}` : ""}</div>
          </div>
          <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="shrink-0 text-sm font-semibold text-coral">Profile →</Link>
        </div>
        {p.description && <p className="mt-3 text-sm text-ink-soft">{p.description}</p>}
        <dl className="mt-3 space-y-1.5 text-sm">
          {(p.addressLine || p.city) && (
            <div className="flex gap-2"><dt className="text-muted"><Icon name="pin" size={16} /></dt><dd>{[p.addressLine, p.city].filter(Boolean).join(", ")}</dd></div>
          )}
          {p.areasServed.length > 0 && (
            <div className="flex gap-2"><dt className="text-muted"><Icon name="map" size={16} /></dt><dd>{p.areasServed.join(" · ")}</dd></div>
          )}
          {p.contactPhone && (
            <div className="flex gap-2"><dt className="text-muted"><Icon name="phone" size={16} /></dt><dd>{p.contactPhone}</dd></div>
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

      {/* ── More from provider ── */}
      {more.length > 0 && (
        <div className="mt-6">
          <div className="sec"><h3>More from {p.businessName}</h3></div>
          <ul className="space-y-2.5">
            {more.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/employee/offer/${o.id}`} className="row mb-0">
                  <span className="ico coral"><Icon name={CAT_ICON[o.category] ?? "gift"} size={20} /></span>
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
