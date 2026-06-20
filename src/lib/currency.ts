// PerxCoin is the app's currency. It is pegged to Albanian Lek for real-world settlement
// (providers are paid cash), but everything the user sees is denominated in coins.
export const COIN_RATE = 100; // 1 PerxCoin = 100 ALL (Lek)

/** Lek → coins (what the user sees). */
export const toCoins = (lek: number): number => Math.round(lek / COIN_RATE);

/** Coins → Lek (what providers settle in). */
export const toLek = (coins: number): number => coins * COIN_RATE;

/** The price actually charged after an offer's discount, in Lek (canonical). */
export const effectiveLek = (priceLek: number, discountPct: number): number =>
  Math.round((priceLek * (100 - (discountPct || 0))) / 100);
