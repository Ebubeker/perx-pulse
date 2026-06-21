import { requireProvider } from "@/lib/account";
import { OfferWizard } from "../OfferWizard";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const p = await requireProvider();
  return <OfferWizard providerCategory={p.category} providerCity={p.city} />;
}
