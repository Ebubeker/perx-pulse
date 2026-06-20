import { prisma } from "./prisma";
import type { OfferCategory } from "@prisma/client";

export const ALL_CATEGORIES: { key: OfferCategory; label: string; emoji: string }[] = [
  { key: "wellness", label: "Wellness", emoji: "🧖" },
  { key: "fitness", label: "Fitness", emoji: "🏋️" },
  { key: "food", label: "Food", emoji: "🥗" },
  { key: "health", label: "Health", emoji: "🩺" },
  { key: "travel", label: "Travel", emoji: "🏖️" },
  { key: "learning", label: "Learning", emoji: "📚" },
  { key: "culture", label: "Culture", emoji: "🎭" },
  { key: "telecom", label: "Telecom", emoji: "📱" },
];

/** Categories the employee has experienced — from settled orders + claimed drops. */
export async function passportFor(employeeProfileId: string): Promise<Set<OfferCategory>> {
  const [orders, claims] = await Promise.all([
    prisma.order.findMany({ where: { employeeProfileId }, select: { offer: { select: { category: true } } } }),
    prisma.dropClaim.findMany({ where: { employeeProfileId }, select: { drop: { select: { category: true } } } }),
  ]);
  const set = new Set<OfferCategory>();
  for (const o of orders) if (o.offer) set.add(o.offer.category);
  for (const c of claims) set.add(c.drop.category);
  return set;
}
