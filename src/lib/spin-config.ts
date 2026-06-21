// ─────────────────────────────────────────────────────────────────────────────
// Daily Spin — the rules, in one place. Client- and server-safe (no imports).
//
// Design intent: the spin is a SYMBOLIC daily hook, not an earnings channel.
// Rewards are deliberately tiny so they nudge people to come back each day
// without inflating the PerxCoin economy (coins are meant to be spent on real
// perks, so a spin should feel like a wink, not a payday).
//
// RULES
//  1. One free spin per calendar day, enforced atomically server-side.
//  2. The wheel has 8 fixed segments (below). The server picks the winning
//     segment uniformly at random; the wheel animates to that exact segment,
//     so what you see is what you won.
//  3. Streak = consecutive days spun. Completing a full ring of STREAK_GOAL
//     days grants a one-time STREAK_BONUS on that day. The ring then resets and
//     a new week begins. That bonus is the ONLY thing the streak pays out.
//
// Economics (keep symbolic): base wheel averages ~3.75 coins/spin; the weekly
// bonus adds ~1.4/day amortized → ~5 coins/day. Tune the numbers here only.
// ─────────────────────────────────────────────────────────────────────────────

/** Wheel segments, in clockwise order starting from the top pointer (index 0). */
export const SPIN_SEGMENTS = [2, 3, 2, 5, 3, 2, 10, 3] as const;

/** A full streak ring = one week of daily spins. */
export const STREAK_GOAL = 7;

/** One-time coins granted when a streak ring is completed. Keep modest. */
export const STREAK_BONUS = 10;
