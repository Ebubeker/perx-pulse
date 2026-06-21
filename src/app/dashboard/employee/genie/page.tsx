import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { Mascot } from "@/components/Mascot";
import { GenieChat } from "./GenieChat";

export const dynamic = "force-dynamic";

export default async function GeniePage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-152px)] max-w-md flex-col px-5 pt-5 md:min-h-[calc(100dvh-96px)]">
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Perx Genie</div>
          <h1>Ask me anything</h1>
        </div>
        <Mascot mood="cool" size={84} className="float" />
      </div>
      <GenieChat />
    </main>
  );
}
