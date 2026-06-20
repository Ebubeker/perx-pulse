"use server";

import { requireMembership } from "./account";
import { askGenie, resolveOffers, type CatalogOffer } from "./gemini";

export type GenieResult = { answer: string; offers: CatalogOffer[] };

/** Free-text AI concierge for the signed-in employee. */
export async function genieAsk(question: string): Promise<{ error?: string } & Partial<GenieResult>> {
  const q = question.trim();
  if (q.length < 3) return { error: "Ask me something about your perks 🙂" };
  if (q.length > 300) return { error: "Keep it short and I'll help faster." };

  const m = await requireMembership();
  const reply = await askGenie({
    question: q,
    budgetLek: m.perksBudgetLek,
    personalization: {
      preferredCategories: m.preferredCategories,
      interests: m.interests,
      wellnessGoals: m.wellnessGoals,
      dietary: m.dietary,
      homeArea: m.homeArea,
    },
  });
  const offers = await resolveOffers(reply.offerIds);
  return { answer: reply.answer, offers };
}
