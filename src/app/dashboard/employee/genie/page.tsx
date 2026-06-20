import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { Mascot } from "@/components/Mascot";
import { GenieChat } from "./GenieChat";

export const dynamic = "force-dynamic";

export default async function GeniePage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-md px-5 py-5">
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Perx Genie · AI concierge</div>
          <h1>Ask me anything</h1>
        </div>
        <Mascot mood="cool" size={64} className="float" />
      </div>
      <p className="mt-1 text-sm text-muted">Tell me what you&apos;ve got and how you feel — I&apos;ll hand back a pack, not a wall of text.</p>
      <GenieChat />
    </main>
  );
}
