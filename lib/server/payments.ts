/**
 * Server-only payment helpers.
 * Real provider keys must live in environment variables — never in client code.
 *
 * Supported providers (Uzbekistan-focused):
 * - click
 * - payme
 * - mock (for local development)
 */

export type PaymentProvider = "click" | "payme" | "mock";

export type CreatePaymentInput = {
  userId: string;
  amountMinor: number; // e.g. 5000000 = 50 000 so'm if minor=100
  currency?: string;
  description: string;
  planId: string; // e.g. "pro_monthly"
  returnUrl?: string;
};

export type CreatePaymentResult = {
  paymentId: string;
  providerPaymentId: string;
  checkoutUrl: string;
  status: "pending";
};

export type WebhookPayload = {
  provider: PaymentProvider;
  providerPaymentId: string;
  status: "success" | "failed" | "cancelled";
  amountMinor?: number;
  raw?: unknown;
};

/** Generate a unique internal payment id */
export function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a payment session.
 * In production: call Click / Payme API with secret keys from env.
 * Here: mock returns a local checkout URL.
 */
export async function createPayment(
  input: CreatePaymentInput,
  provider: PaymentProvider = "mock"
): Promise<CreatePaymentResult> {
  const paymentId = generatePaymentId();
  const providerPaymentId = `${provider}_${paymentId}`;

  // --- Real providers would go here ---
  // if (provider === "click") { ... use process.env.CLICK_SECRET ... }
  // if (provider === "payme") { ... use process.env.PAYME_KEY ... }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    paymentId,
    providerPaymentId,
    checkoutUrl: `${baseUrl}/pay/checkout?pid=${paymentId}&provider=${provider}`,
    status: "pending",
  };
}

/**
 * Verify webhook signature (stub).
 * Real Click/Payme webhooks must be verified with their secret.
 */
export function verifyWebhookSignature(
  provider: PaymentProvider,
  _headers: Headers,
  _body: string
): boolean {
  if (provider === "mock") return true;

  // Example for real providers:
  // const signature = headers.get("x-click-signature");
  // const secret = process.env.CLICK_SECRET;
  // return hmac(body, secret) === signature;

  const hasSecret =
    (provider === "click" && process.env.CLICK_SECRET) ||
    (provider === "payme" && process.env.PAYME_KEY);

  // Without real secret configured — reject in production mindset
  if (!hasSecret && process.env.NODE_ENV === "production") {
    return false;
  }

  return true; // allow in dev
}

/**
 * Activate subscription only after successful payment confirmation.
 * This must run ONLY on the server (webhook or admin action).
 */
export async function activateSubscription(params: {
  userId: string;
  planId: string;
  providerPaymentId: string;
  provider: PaymentProvider;
  amountMinor: number;
}): Promise<{ subscriptionId: string; status: "active" }> {
  // In real app:
  // 1. Insert into payments (status=succeeded)
  // 2. Upsert subscriptions (status=active, starts_at, ends_at)
  // 3. Never trust client — only webhook / server job

  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  console.info("[VOOSITA] Subscription activated", {
    subscriptionId,
    userId: params.userId,
    planId: params.planId,
    providerPaymentId: params.providerPaymentId,
  });

  return { subscriptionId, status: "active" };
}
