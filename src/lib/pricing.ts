// Perx's two money rails, in one place — so the billing UI and the pitch always agree.
// Pure functions, no imports beyond the currency peg. Lek is canonical.
import { LEK_PER_USD, toUsd } from "./currency";

// ─────────────────────────────────────────────────────────────────────────────
// 1) EMPLOYER SUBSCRIPTION — dynamic, tiered per-seat. 100-seat floor.
//    The whole headcount bills at the rate of the tier its seat count falls in.
//    (e.g. 500 seats → 500 × 350 = 175,000 ALL/mo)
// ─────────────────────────────────────────────────────────────────────────────
export const SEAT_FLOOR = 100;

export const SEAT_TIERS: { upTo: number; ratePerSeatLek: number }[] = [
  { upTo: 250, ratePerSeatLek: 400 },
  { upTo: 1000, ratePerSeatLek: 350 },
  { upTo: Infinity, ratePerSeatLek: 300 },
];

/** Billed seats = headcount, but never below the 100-seat floor. */
export function billableSeats(headcount: number): number {
  return Math.max(SEAT_FLOOR, Math.max(0, Math.floor(headcount || 0)));
}

/** The per-seat rate (Lek/month) for a given headcount's tier. */
export function ratePerSeatLek(headcount: number): number {
  const s = billableSeats(headcount);
  return (SEAT_TIERS.find((t) => s <= t.upTo) ?? SEAT_TIERS[SEAT_TIERS.length - 1]!).ratePerSeatLek;
}

/** Total monthly subscription in Lek for a given headcount. */
export function subscriptionMonthlyLek(headcount: number): number {
  return billableSeats(headcount) * ratePerSeatLek(headcount);
}

/** Total monthly subscription in USD (approx, display + checkout). */
export function subscriptionMonthlyUsd(headcount: number): number {
  return toUsd(subscriptionMonthlyLek(headcount));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) COIN FLOAT COMMISSION — Perx earns $1 for every 100 coins a company buys.
//    Coins are face-backed (1 coin = 100 Lek) into the treasury; the commission
//    is Perx's cut on top of face value.
// ─────────────────────────────────────────────────────────────────────────────
export const COMMISSION_USD_PER_100_COINS = 1;

/** Face value (Lek) the company funds into its treasury for `coins` coins. */
export function coinFaceLek(coins: number): number {
  return Math.max(0, Math.floor(coins || 0)) * 100;
}

/** Perx commission for buying `coins` coins, in USD. */
export function coinCommissionUsd(coins: number): number {
  return Math.round((Math.max(0, coins || 0) / 100) * COMMISSION_USD_PER_100_COINS);
}

/** Perx commission for buying `coins` coins, in Lek. */
export function coinCommissionLek(coins: number): number {
  return Math.round((Math.max(0, coins || 0) / 100) * COMMISSION_USD_PER_100_COINS * LEK_PER_USD);
}

/** What the company pays in total to buy `coins`: face value + Perx commission (Lek). */
export function coinTotalCostLek(coins: number): number {
  return coinFaceLek(coins) + coinCommissionLek(coins);
}
