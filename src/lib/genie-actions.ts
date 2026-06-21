"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireMembership } from "./account";
import { askGenie, resolveOffers, type CatalogOffer } from "./gemini";

export type GenieResult = { answer: string; offers: CatalogOffer[] };
export type GenieTurn = { role: "user" | "genie"; text: string; offers: CatalogOffer[] };
export type ConvMeta = { id: string; title: string; updatedAt: string; count: number };

/** Free-text AI concierge. Saves the turn into a new or existing conversation (Genie's memory). */
export async function genieAsk(
  question: string,
  conversationId?: string,
): Promise<{ error?: string; answer?: string; offers?: CatalogOffer[]; conversationId?: string }> {
  const q = question.trim();
  if (q.length < 3) return { error: "Ask me something about your perks." };
  if (q.length > 300) return { error: "Keep it short and I'll help faster." };

  const m = await requireMembership();

  // Resolve or create the conversation (ownership-checked).
  let convId = conversationId;
  if (convId) {
    const owned = await prisma.genieConversation.findFirst({ where: { id: convId, employeeProfileId: m.id }, select: { id: true } });
    if (!owned) convId = undefined;
  }
  if (!convId) {
    const conv = await prisma.genieConversation.create({ data: { employeeProfileId: m.id, title: q.length > 60 ? q.slice(0, 57) + "…" : q } });
    convId = conv.id;
  }

  await prisma.genieMessage.create({ data: { conversationId: convId, role: "user", text: q } });

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
    aiProfile: m.aiProfile,
  });
  const offers = await resolveOffers(reply.offerIds);

  await prisma.$transaction([
    prisma.genieMessage.create({ data: { conversationId: convId, role: "genie", text: reply.answer, offerIds: offers.map((o) => o.id) } }),
    prisma.genieConversation.update({ where: { id: convId }, data: { updatedAt: new Date() } }),
  ]);

  revalidatePath("/dashboard/employee/genie");
  return { answer: reply.answer, offers, conversationId: convId };
}

/** The signed-in employee's saved Genie conversations, newest first. */
export async function listGenieConversations(): Promise<ConvMeta[]> {
  const m = await requireMembership();
  const convs = await prisma.genieConversation.findMany({
    where: { employeeProfileId: m.id },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: { _count: { select: { messages: true } } },
  });
  return convs.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString(), count: c._count.messages }));
}

/** Load one conversation's full turns (offers re-resolved) to resume it. */
export async function getGenieConversation(id: string): Promise<{ error?: string; conversationId?: string; messages?: GenieTurn[] }> {
  const m = await requireMembership();
  const conv = await prisma.genieConversation.findFirst({
    where: { id, employeeProfileId: m.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conv) return { error: "Conversation not found." };
  const messages: GenieTurn[] = await Promise.all(
    conv.messages.map(async (msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("genie" as const),
      text: msg.text,
      offers: msg.offerIds.length ? await resolveOffers(msg.offerIds) : [],
    })),
  );
  return { conversationId: conv.id, messages };
}
