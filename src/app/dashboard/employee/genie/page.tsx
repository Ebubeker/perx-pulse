import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { ensureEmployeeProfile } from "@/lib/ai-profile";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { GenieChat } from "./GenieChat";

export const dynamic = "force-dynamic";

export default async function GeniePage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");

  // Perx's saved memory of this employee — generated if missing/stale. Powers every answer below.
  const profile = await ensureEmployeeProfile(m.id, m.aiProfile, m.aiProfileAt);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-152px)] max-w-md flex-col px-5 pt-5 md:min-h-[calc(100dvh-96px)] md:max-w-3xl md:px-8">
      <div className="flex items-start justify-between gap-2">
        <div className="greet">
          <div className="day">Perx Genie</div>
          <h1>Ask me anything</h1>
        </div>
        <Mascot mood="cool" size={84} className="float" />
      </div>

      {profile && (
        <div className="mt-3 rounded-2xl border border-line bg-cream/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-coral-deep">
            <Icon name="sparkles" size={13} /> What Perx remembers about you
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{profile}</p>
        </div>
      )}

      <GenieChat />
    </main>
  );
}
