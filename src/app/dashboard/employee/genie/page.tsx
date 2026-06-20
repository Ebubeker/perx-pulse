import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { GenieChat } from "./GenieChat";

export const dynamic = "force-dynamic";

export default async function GeniePage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <p className="mt-1 text-sm font-semibold tracking-wide text-violet">PERX GENIE · AI concierge</p>
      <h1 className="text-2xl font-bold">Ask me anything</h1>
      <GenieChat />
    </main>
  );
}
