import { prisma } from "./prisma";
import type { OfferCategory } from "@prisma/client";

export const ALL_CATEGORIES: { key: OfferCategory; label: string; icon: string }[] = [
  { key: "wellness", label: "Wellness", icon: "wellness" },
  { key: "fitness", label: "Fitness", icon: "fitness" },
  { key: "food", label: "Food", icon: "food" },
  { key: "health", label: "Health", icon: "health" },
  { key: "travel", label: "Travel", icon: "travel" },
  { key: "learning", label: "Learning", icon: "learning" },
  { key: "culture", label: "Culture", icon: "culture" },
  { key: "telecom", label: "Telecom", icon: "telecom" },
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
