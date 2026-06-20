import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
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
      <main className="mx-auto max-w-md px-6 py-16 text-center text-muted">
        This offer isn&apos;t available. <Link href="/dashboard/employee" className="text-primary underline">Back to perks</Link>
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
    <main className="mx-auto max-w-md px-6 py-8">
      <p className="text-sm font-semibold tracking-wide text-accent">{CAT_LABEL[offer.category] ?? offer.category}</p>
      <h1 className="mt-1 text-2xl font-bold">{offer.title}</h1>
      <p className="mt-1 text-sm text-muted">
        <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="font-medium text-primary underline-offset-2 hover:underline">{p.businessName}</Link>
        {offer.area ? ` · ${offer.area}` : ""}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl font-bold">{offer.priceLek.toLocaleString("en-US")} L</span>
        {offer.taxFree && <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Tax-free</span>}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold text-muted">What you get</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
          {offer.description || "The provider hasn't added a description for this perk yet — tap below to add it to a pack and your HR will see the details on the voucher."}
        </p>
      </div>

      <div className="mt-4">
        <AddOfferButton offerId={offer.id} />
        <p className="mt-2 text-center text-xs text-muted">Adds to a pack you can send to HR. Fully employer-funded.</p>
      </div>

      {/* Provider */}
      <div className="mt-7 rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold">About {p.businessName}</h2>
          <Link href={`/dashboard/employee/provider/${offer.providerId}`} className="shrink-0 text-sm font-semibold text-primary">View profile →</Link>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Hours</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {hours.map(([day, val]) => (
                <li key={day} className="flex justify-between"><span className="capitalize text-muted">{day}</span><span>{val}</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {more.length > 0 && (
        <div className="mt-7">
          <h2 className="mb-2 text-sm font-semibold text-muted">More from {p.businessName}</h2>
          <ul className="space-y-2">
            {more.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/employee/offer/${o.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium">{o.title}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink-soft">{o.priceLek.toLocaleString("en-US")} L</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
