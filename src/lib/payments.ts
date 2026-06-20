import { randomBytes } from "node:crypto";

/** Perx's marketplace split for one settled line: employer pays gross, provider nets the rest. */
export function splitFor(grossLek: number, takeRatePct: number): { feeLek: number; netLek: number } {
  const feeLek = Math.round((grossLek * takeRatePct) / 100);
  return { feeLek, netLek: grossLek - feeLek };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** A short human-readable redemption code, e.g. PERX-7K3Q9F. */
export function voucherCode(): string {
  const bytes = randomBytes(6);
  let body = "";
  for (let i = 0; i < 6; i++) body += ALPHABET[bytes[i]! % ALPHABET.length];
  return `PERX-${body}`;
}
