import { NextRequest, NextResponse } from "next/server";
import { createPayment, type PaymentProvider } from "@/lib/server/payments";

/**
 * POST /api/payments/create
 * Body: { userId, amountMinor, planId, description?, provider? }
 *
 * Creates a pending payment and returns checkout URL.
 * Never activates subscription here — only after webhook confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userId = body.userId as string;
    const amountMinor = Number(body.amountMinor);
    const planId = body.planId as string;
    const description = (body.description as string) || `VOOSITA plan ${planId}`;
    const provider = (body.provider as PaymentProvider) || "mock";

    if (!userId || !amountMinor || !planId) {
      return NextResponse.json(
        { error: "userId, amountMinor and planId are required" },
        { status: 400 }
      );
    }

    if (amountMinor < 1000) {
      return NextResponse.json({ error: "amount too small" }, { status: 400 });
    }

    // TODO production: verify user from session / Supabase JWT
    const result = await createPayment(
      {
        userId,
        amountMinor,
        planId,
        description,
        currency: "UZS",
      },
      provider
    );

    // TODO: insert into payments table status=pending

    return NextResponse.json({
      ok: true,
      paymentId: result.paymentId,
      providerPaymentId: result.providerPaymentId,
      checkoutUrl: result.checkoutUrl,
      status: result.status,
    });
  } catch (err) {
    console.error("[payments/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
