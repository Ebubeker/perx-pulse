import { createHmac, timingSafeEqual } from "node:crypto";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

function env() {
  return {
    apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
    storeId: process.env.LEMONSQUEEZY_STORE_ID || "",
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID || "",
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
  };
}

export function billingConfigured(): boolean {
  const e = env();
  return Boolean(e.apiKey && e.storeId && e.variantId);
}

/** Create a real Lemon Squeezy (test-mode) hosted checkout for a company. Returns the checkout URL. */
export async function createCheckout(opts: { companyId: string; email: string; name?: string }): Promise<string> {
  const e = env();
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: opts.email,
          name: opts.name,
          custom: { company_id: opts.companyId },
        },
        product_options: {
          redirect_url: `${e.appUrl}/dashboard/company/billing/success`,
          enabled_variants: [Number(e.variantId)],
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(e.storeId) } },
        variant: { data: { type: "variants", id: String(e.variantId) } },
      },
    },
  };

  const res = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${e.apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon checkout failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("Lemon checkout returned no URL");
  return url;
}

/** Verify a Lemon webhook signature (HMAC-SHA256 of the raw body with the webhook secret). */
export function verifyLemonSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const e = env();
  if (!e.webhookSecret) return false;
  const digest = createHmac("sha256", e.webhookSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
