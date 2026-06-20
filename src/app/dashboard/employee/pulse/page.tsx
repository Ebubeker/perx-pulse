import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { PulseForm } from "./PulseForm";

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  return <PulseForm />;
}
