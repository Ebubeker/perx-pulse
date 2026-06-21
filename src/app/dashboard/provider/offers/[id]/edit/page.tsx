import { notFound } from "next/navigation";
import { requireProvider } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { toCoins } from "@/lib/currency";
import { OfferWizard } from "../../OfferWizard";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requireProvider();
  const offer = await prisma.offer.findFirst({ where: { id, providerId: p.id } });
  if (!offer) notFound();

  return (
    <OfferWizard
      providerCategory={p.category}
      providerCity={p.city}
      initial={{
        id: offer.id,
        title: offer.title,
        description: offer.description ?? "",
        category: offer.category,
        priceCoins: String(toCoins(offer.priceLek)),
        discountPct: offer.discountPct ? String(offer.discountPct) : "",
        area: offer.area ?? "",
        taxFree: offer.taxFree,
        imageUrl: offer.imageUrl ?? "",
        teamSize: offer.teamSize ? String(offer.teamSize) : undefined,
      }}
    />
  );
}
