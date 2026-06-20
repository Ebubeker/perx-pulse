import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";

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
      <main className="mx-auto max-w-md px-6 py-16 text-center text-muted">
        Provider not found. <Link href="/dashboard/employee" className="text-primary underline">Back to perks</Link>
      </main>
    );
  }

  const hours = provider.openingHours && typeof provider.openingHours === "object" && !Array.isArray(provider.openingHours)
    ? Object.entries(provider.openingHours as Record<string, unknown>).map(([k, v]) => [k, String(v)] as const)
    : [];
  const priceFrom = provider.offers.length ? Math.min(...provider.offers.map((o) => effectiveLek(o.priceLek, o.discountPct))) : null;

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <p className="text-sm font-semibold tracking-wide text-accent">{CAT_LABEL[provider.category] ?? provider.category}</p>
      <h1 className="mt-1 text-2xl font-bold">{provider.businessName}</h1>
      {provider.description && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{provider.description}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold">{provider.offers.length}</p>
          <p className="text-xs text-muted">offers available</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-2xl font-bold text-primary">{priceFrom !== null ? <Coins amount={toCoins(priceFrom)} /> : "—"}</p>
          <p className="text-xs text-muted">from</p>
        </div>
      </div>

      {(provider.addressLine || provider.city || provider.areasServed.length > 0 || provider.contactPhone || hours.length > 0) && (
        <div className="mt-4 rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-display text-base font-bold">Good to know</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {(provider.addressLine || provider.city) && (
              <div className="flex gap-2"><dt className="text-muted">📍</dt><dd>{[provider.addressLine, provider.city].filter(Boolean).join(", ")}</dd></div>
            )}
            {provider.areasServed.length > 0 && (
              <div className="flex gap-2"><dt className="text-muted">🗺️</dt><dd>{provider.areasServed.join(" · ")}</dd></div>
            )}
            {provider.contactPhone && (
              <div className="flex gap-2"><dt className="text-muted">📞</dt><dd>{provider.contactPhone}</dd></div>
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
      )}

      <h2 className="mb-2 mt-7 font-display text-lg font-bold">Offers from {provider.businessName}</h2>
      {provider.offers.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">No live offers right now.</p>
      ) : (
        <ul className="space-y-2">
          {provider.offers.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/employee/offer/${o.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{o.title}</span>
                  <span className="block truncate text-xs text-muted">{CAT_LABEL[o.category] ?? o.category}{o.area ? ` · ${o.area}` : ""}{o.taxFree ? " · tax-free" : ""}{o.discountPct > 0 ? ` · −${o.discountPct}%` : ""}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink-soft"><Coins amount={toCoins(effectiveLek(o.priceLek, o.discountPct))} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
