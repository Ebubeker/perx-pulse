import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Food", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
};

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: { offers: { where: { active: true }, orderBy: { priceLek: "asc" } } },
  });
  if (!provider) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center text-muted">
        Provider not found. <Link href="/dashboard/employee" className="font-semibold text-coral underline">Back to perks</Link>
      </main>
    );
  }

  const hours = provider.openingHours && typeof provider.openingHours === "object" && !Array.isArray(provider.openingHours)
    ? Object.entries(provider.openingHours as Record<string, unknown>).map(([k, v]) => [k, String(v)] as const)
    : [];
  const priceFrom = provider.offers.length ? Math.min(...provider.offers.map((o) => effectiveLek(o.priceLek, o.discountPct))) : null;

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      {/* provider header card */}
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="chip on">{CAT_LABEL[provider.category] ?? provider.category}</span>
          <span className="pill pill-ready"><span className="dot" />Active</span>
        </div>
        <h1 className="mt-3 font-display text-[28px] font-bold leading-tight">{provider.businessName}</h1>
        {provider.description && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{provider.description}</p>}
      </div>

      {/* stats */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="stat">
          <div className="k">Offers</div>
          <div className="v">{provider.offers.length}</div>
          <div className="d">available now</div>
        </div>
        <div className="stat">
          <div className="k">From</div>
          <div className="v text-coral">{priceFrom !== null ? <Coins amount={toCoins(priceFrom)} /> : "—"}</div>
          <div className="d">lowest price</div>
        </div>
      </div>

      {(provider.addressLine || provider.city || provider.areasServed.length > 0 || provider.contactPhone || hours.length > 0) && (
        <div className="card mt-3">
          <h2 className="font-display text-base font-bold">Good to know</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {(provider.addressLine || provider.city) && (
              <div className="flex gap-2"><dt className="text-muted"><Icon name="pin" size={16} /></dt><dd>{[provider.addressLine, provider.city].filter(Boolean).join(", ")}</dd></div>
            )}
            {provider.areasServed.length > 0 && (
              <div className="flex gap-2"><dt className="text-muted"><Icon name="map" size={16} /></dt><dd>{provider.areasServed.join(" · ")}</dd></div>
            )}
            {provider.contactPhone && (
              <div className="flex gap-2"><dt className="text-muted"><Icon name="phone" size={16} /></dt><dd>{provider.contactPhone}</dd></div>
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
      )}

      <div className="sec"><h3>Offers from {provider.businessName}</h3></div>
      {provider.offers.length === 0 ? (
        <div className="card text-center text-sm text-muted">No live offers right now.</div>
      ) : (
        <ul className="space-y-2.5">
          {provider.offers.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/employee/offer/${o.id}`} className="row mb-0">
                <span className="ico coral">✦</span>
                <div className="grow">
                  <div className="t truncate">{o.title}</div>
                  <div className="s truncate">
                    {CAT_LABEL[o.category] ?? o.category}{o.area ? ` · ${o.area}` : ""}{o.taxFree ? " · tax-free" : ""}{o.discountPct > 0 ? ` · −${o.discountPct}%` : ""}
                  </div>
                </div>
                <span className="amt"><Coins amount={toCoins(effectiveLek(o.priceLek, o.discountPct))} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
