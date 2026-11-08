import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  activateSubscription,
  type PaymentProvider,
} from "@/lib/server/payments";

/**
 * POST /api/webhooks/payment
 * Called by payment provider after user pays.
 * ONLY place where subscription becomes active.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown>;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const provider = (body.provider as PaymentProvider) || "mock";
    const providerPaymentId = body.providerPaymentId as string;
    const status = body.status as "success" | "failed" | "cancelled";
    const userId = body.userId as string;
    const planId = (body.planId as string) || "pro_monthly";
    const amountMinor = Number(body.amountMinor) || 0;

    if (!providerPaymentId || !status) {
      return NextResponse.json(
        { error: "providerPaymentId and status required" },
        { status: 400 }
      );
    }

    const valid = verifyWebhookSignature(provider, req.headers, rawBody);
    if (!valid) {
      console.warn("[webhook] Invalid signature", { provider });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    if (status !== "success") {
      return NextResponse.json({ ok: true, activated: false, status });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId required for activation" },
        { status: 400 }
      );
    }

    const sub = await activateSubscription({
      userId,
      planId,
      providerPaymentId,
      provider,
      amountMinor,
    });

    return NextResponse.json({
      ok: true,
      activated: true,
      subscriptionId: sub.subscriptionId,
      status: sub.status,
    });
  } catch (err) {
    console.error("[webhooks/payment]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
