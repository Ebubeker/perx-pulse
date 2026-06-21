"use server";

import { requireCompanyAdmin } from "./account";
import { companyBrief, companyDataChat } from "./company-ai";

/** AI executive summary + recommended actions for the signed-in admin's company. */
export async function getCompanyBrief(): Promise<{ summary: string; actions: string[] } | null> {
  const m = await requireCompanyAdmin();
  return companyBrief(m.companyId);
}

/** Ask the HR data copilot a question about the team. */
export async function askCompanyData(question: string): Promise<{ answer: string }> {
  const m = await requireCompanyAdmin();
  if (typeof question !== "string" || question.length > 400) return { answer: "Keep your question short and I'll help faster." };
  return companyDataChat(question, m.companyId);
}
