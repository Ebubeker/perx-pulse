import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins, effectiveLek } from "@/lib/currency";
import { Coins } from "@/components/Coins";
import { Icon, type IconName } from "@/components/Icon";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  wellness: "Wellness", fitness: "Fitness", food: "Food", health: "Health",
  travel: "Travel", learning: "Learning", culture: "Culture", telecom: "Telecom",
};
const CAT_ICON: Record<string, IconName> = {
  wellness: "wellness", fitness: "fitness", food: "food", health: "health",
  travel: "travel", learning: "learning", culture: "culture", telecom: "telecom",
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
      <main className="page">
        <div className="card text-center text-muted">
          Provider not found. <Link href="/dashboard/employee" className="font-semibold text-coral underline">Back to perks</Link>
        </div>
      </main>
    );
  }

  const hours = provider.openingHours && typeof provider.openingHours === "object" && !Array.isArray(provider.openingHours)
    ? Object.entries(provider.openingHours as Record<string, unknown>).map(([k, v]) => [k, String(v)] as const)
    : [];
  const priceFrom = provider.offers.length ? Math.min(...provider.offers.map((o) => effectiveLek(o.priceLek, o.discountPct))) : null;
  const taxFreeCount = provider.offers.filter((o) => o.taxFree).length;
  const metaLine = [CAT_LABEL[provider.category] ?? provider.category, provider.city].filter(Boolean).join(" · ");

  return (
    <main className="page">
      <Link href="/dashboard/employee" className="link text-sm font-semibold text-muted">← All providers</Link>

      {/* ── Provider header — the directory .pcard style ── */}
      <div className="pcard" style={{ marginTop: 14 }}>
        <div className="ph" style={{ height: 120, background: "var(--coral-soft)", color: "var(--coral-deep)" }}>
          <Icon name={CAT_ICON[provider.category] ?? "store"} size={34} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="nm" style={{ fontSize: 22 }}>{provider.businessName}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{metaLine}</div>
          </div>
          <span className="pill pill-ready shrink-0"><span className="dot" />Active</span>
        </div>
        {provider.description && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{provider.description}</p>}
      </div>

      {/* ── Stats ── */}
      <div className="grid g-3 mt-4">
        <div className="stat">
          <div className="k">Offers</div>
          <div className="v">{provider.offers.length}</div>
          <div className="d">live now</div>
        </div>
        <div className="stat">
          <div className="k">From</div>
          <div className="v text-coral">{priceFrom !== null ? <Coins amount={toCoins(priceFrom)} /> : "—"}</div>
          <div className="d">lowest</div>
        </div>
        <div className="stat">
          <div className="k">Tax-free</div>
          <div className="v">{taxFreeCount}</div>
          <div className="d">of {provider.offers.length}</div>
        </div>
      </div>

      {/* ── Good to know ── */}
      {(provider.addressLine || provider.city || provider.areasServed.length > 0 || provider.contactPhone || hours.length > 0) && (
        <div className="card mt-4">
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

      {/* ── Their offers as .row links ── */}
      <div className="sec"><h3>Offers</h3></div>
      {provider.offers.length === 0 ? (
        <div className="card text-center text-sm text-muted">No live offers right now.</div>
      ) : (
        <div>
          {provider.offers.map((o) => (
            <Link key={o.id} href={`/dashboard/employee/offer/${o.id}`} className="row">
              <span className="ico coral"><Icon name={CAT_ICON[o.category] ?? "gift"} size={20} /></span>
              <div className="grow">
                <div className="t truncate">{o.title}</div>
                <div className="s truncate">
                  {CAT_LABEL[o.category] ?? o.category}{o.area ? ` · ${o.area}` : ""}{o.discountPct > 0 ? ` · −${o.discountPct}%` : ""}
                </div>
              </div>
              <span className="amt"><Coins amount={toCoins(effectiveLek(o.priceLek, o.discountPct))} /></span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
