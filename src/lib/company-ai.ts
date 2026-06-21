import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { prisma } from "./prisma";
import { toCoins } from "./currency";
import { companyInsights, type CompanyInsights } from "./insights";

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  return _ai;
}

/** Aggregate everything an HR admin's AI needs: company KPIs + each employee's saved AI memory. */
export async function buildCompanyContext(companyId: string): Promise<{ text: string; insights: CompanyInsights } | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, brandName: true, monthlySpreadCoins: true, treasuryCoins: true },
  });
  if (!company) return null;

  const [ins, employees, orders] = await Promise.all([
    companyInsights(companyId),
    prisma.employeeProfile.findMany({
      where: { companyId, role: "EMPLOYEE" },
      select: { displayName: true, recognitionCoins: true, aiProfile: true, department: { select: { name: true } } },
      take: 60,
    }),
    prisma.order.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 40, select: { title: true } }),
  ]);

  const moodLine = ins.moods.filter((x) => x.count > 0).map((x) => `${x.mood} ${x.count}`).join(", ") || "no check-ins yet";
  const demandLine = ins.categoryDemand.filter((c) => c.count > 0).sort((a, b) => b.count - a.count).map((c) => `${c.category} ${c.count}`).join(", ") || "none yet";
  const topPerks = [...new Set(orders.map((o) => o.title))].slice(0, 8).join(", ") || "none yet";

  const roster = employees
    .map((e) => `- ${e.displayName}${e.department?.name ? ` (${e.department.name})` : ""}, wallet ${e.recognitionCoins} coins: ${e.aiProfile || "no profile yet"}`)
    .join("\n");

  const text =
    `COMPANY: ${company.brandName || company.name}\n` +
    `Headcount: ${ins.headcount}. Perx Score: ${ins.perxScore}/100. ` +
    `Pulse participation: ${ins.participationPct}%. Engagement: ${ins.engagementPct}%.\n` +
    `Team mood this period: ${moodLine}.\n` +
    `Where demand is (redemptions by category): ${demandLine}.\n` +
    `Budget used: ${toCoins(ins.budgetUsed)} of ${toCoins(ins.budgetTotal)} coins. Coins moved in recognition this month: ${ins.coinsMovedThisMonth}.\n` +
    `Treasury: ${company.treasuryCoins} coins. Monthly spread per employee: ${company.monthlySpreadCoins} coins.\n` +
    `Most redeemed perks: ${topPerks}.\n\n` +
    `EMPLOYEES (each with Perx's AI memory of them):\n${roster}`;

  return { text, insights: ins };
}

/** Deterministic brief from the numbers — the fallback when the model is unavailable. */
function fallbackBrief(ins: CompanyInsights): { summary: string; actions: string[] } {
  const topMood = [...ins.moods].sort((a, b) => b.count - a.count)[0];
  const topCat = [...ins.categoryDemand].sort((a, b) => b.count - a.count)[0];
  const budgetPct = ins.budgetTotal ? Math.round((ins.budgetUsed / ins.budgetTotal) * 100) : 0;
  return {
    summary: `Your Perx Score is ${ins.perxScore}/100 with ${ins.participationPct}% Pulse participation and ${ins.engagementPct}% engagement. ${topMood && topMood.count ? `The team is feeling mostly ${topMood.mood.toLowerCase()}.` : ""} ${topCat && topCat.count ? `Demand leans toward ${topCat.category}.` : ""}`.trim(),
    actions: [
      topCat && topCat.count ? `Fund more ${topCat.category} providers where demand is highest.` : "Encourage the team to redeem their perks.",
      ins.participationPct < 60 ? "Nudge the team to take this week's Pulse to sharpen recommendations." : "Recognize top contributors to keep momentum.",
      budgetPct < 50 ? "Run a Drop to put idle budget to work this month." : "Top up the treasury so recognition keeps flowing.",
    ],
  };
}

const BriefSchema = z.object({ summary: z.string(), actions: z.array(z.string()).default([]) });

/** AI executive summary + recommended actions for the HR admin, grounded in real company data. */
export async function companyBrief(companyId: string): Promise<{ summary: string; actions: string[] } | null> {
  const ctx = await buildCompanyContext(companyId);
  if (!ctx) return null;

  try {
    const prompt =
      `You are an HR analytics advisor for a company using Perx (an employee-benefits platform). ` +
      `From the team data below, write (1) a 2 to 3 sentence executive summary of team wellbeing and engagement, ` +
      `calling out what stands out, and (2) exactly 3 specific, actionable recommendations (each a short imperative sentence). ` +
      `Reference real signals (moods, category demand, budget, specific people if useful). No em dashes.\n\n` +
      `${ctx.text}\n\n` +
      `Return ONLY JSON: {"summary":"...","actions":["...","...","..."]}`;
    const resp = await ai().models.generateContent({
      model: process.env.MODEL_PERSONA || "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } },
    });
    const parsed = BriefSchema.parse(JSON.parse((resp as { text?: string }).text || "{}"));
    const actions = parsed.actions.map((a) => a.replace(/\s*—\s*/g, ", ")).slice(0, 4);
    if (parsed.summary.trim()) return { summary: parsed.summary.trim().replace(/\s*—\s*/g, ", "), actions };
  } catch (e) {
    console.error("[company-brief] fallback:", (e as Error)?.message || e);
  }
  return fallbackBrief(ctx.insights);
}

/** The HR data copilot: answer a free-text question about the team, grounded in the company context. */
export async function companyDataChat(question: string, companyId: string): Promise<{ answer: string }> {
  const q = question.trim();
  if (q.length < 2) return { answer: "Ask me anything about your team, like 'what does my team want?' or 'who hasn't used their coins?'" };
  const ctx = await buildCompanyContext(companyId);
  if (!ctx) return { answer: "I couldn't load your team data right now." };

  try {
    const prompt =
      `You are Perx's analytics copilot for an HR admin. Answer the question using ONLY the team data below. ` +
      `Be specific and concise (2 to 4 sentences). Reference real names, departments, and numbers when relevant, ` +
      `and end with one concrete next step. If the data does not cover it, say so plainly. No em dashes.\n\n` +
      `${ctx.text}\n\n` +
      `Question: ${q}`;
    const resp = await ai().models.generateContent({
      model: process.env.MODEL_PERSONA || "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.5, maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
    });
    const answer = (resp as { text?: string }).text?.trim().replace(/\s*—\s*/g, ", ");
    if (answer) return { answer };
  } catch (e) {
    console.error("[company-chat] fallback:", (e as Error)?.message || e);
  }
  return { answer: "I'm having trouble reaching the model right now. Try again in a moment." };
}
