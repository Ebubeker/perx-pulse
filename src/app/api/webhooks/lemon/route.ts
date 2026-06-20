import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLemonSignature } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LemonEvent = {
  meta?: { event_name?: string; custom_data?: { company_id?: string } };
  data?: { id?: string; type?: string; attributes?: { status?: string; customer_id?: number | string } };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: LemonEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "";
  const companyId = event.meta?.custom_data?.company_id;
  const attrs = event.data?.attributes ?? {};
  const customerId = attrs.customer_id != null ? String(attrs.customer_id) : null;

  // We can only attribute events we tagged with a company_id at checkout time.
  if (!companyId) {
    console.warn("[lemon] event without company_id:", eventName);
    return NextResponse.json({ received: true });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    console.warn("[lemon] unknown company:", companyId);
    return NextResponse.json({ received: true });
  }

  if (eventName === "order_created") {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        billingStatus: attrs.status === "paid" ? "active" : attrs.status ?? null,
        billingPlan: "Perx Business",
        lemonOrderId: event.data?.id ?? null,
        lemonCustomerId: customerId,
        subscribedAt: new Date(),
      },
    });
  } else if (eventName === "subscription_created" || eventName === "subscription_updated") {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        billingStatus: attrs.status ?? null,
        billingPlan: "Perx Business",
        lemonSubscriptionId: event.data?.id ?? null,
        lemonCustomerId: customerId,
        subscribedAt: new Date(),
      },
    });
  } else if (eventName === "subscription_expired" || eventName === "subscription_cancelled") {
    await prisma.company.update({ where: { id: companyId }, data: { billingStatus: "cancelled" } });
  }

  return NextResponse.json({ received: true });
}
