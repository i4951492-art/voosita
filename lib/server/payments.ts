/**
 * Server-only payment helpers.
 * Real provider keys must live in environment variables, never in client code.
 *
 * Supported providers (Uzbekistan-focused):
 * - click
 * - payme
 * - mock (local development only, refused in production)
 */
import { createHmac, timingSafeEqual } from "crypto";

export type PaymentProvider = "click" | "payme" | "mock";

export type CreatePaymentInput = {
  userId: string;
  amountMinor: number; // minor units (tiyin). 100 tiyin = 1 so'm
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

const SECRET_ENV: Record<Exclude<PaymentProvider, "mock">, string> = {
  click: "CLICK_SECRET",
  payme: "PAYME_KEY",
};

const SIGNATURE_HEADER: Record<Exclude<PaymentProvider, "mock">, string> = {
  click: "x-click-signature",
  payme: "x-payme-signature",
};

/** Generate a unique internal payment id */
export function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a payment session.
 * Only the mock provider is implemented. Real providers throw until their
 * API integration is written, so nothing can pretend to be a real payment.
 */
export async function createPayment(
  input: CreatePaymentInput,
  provider: PaymentProvider = "mock"
): Promise<CreatePaymentResult> {
  if (provider !== "mock") {
    throw new Error(`Provider "${provider}" is not integrated yet`);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Mock provider is disabled in production");
  }

  const paymentId = generatePaymentId();
  const providerPaymentId = `${provider}_${paymentId}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    paymentId,
    providerPaymentId,
    checkoutUrl: `${baseUrl}/pay/checkout?pid=${paymentId}&provider=${provider}`,
    status: "pending",
  };
}

/**
 * Verify a webhook signature.
 * Fails closed: without a configured secret or a matching signature, the
 * webhook is rejected.
 *
 * NOTE: this uses HMAC-SHA256 over the raw body as a placeholder. Click and
 * Payme each define their own signing scheme (Click uses MD5 over specific
 * fields, Payme uses HTTP Basic auth with a key). Replace the body of the
 * non-mock branch with the scheme from each provider's documentation.
 */
export function verifyWebhookSignature(
  provider: PaymentProvider,
  headers: Headers,
  body: string
): boolean {
  if (provider === "mock") {
    return process.env.NODE_ENV !== "production";
  }

  const secret = process.env[SECRET_ENV[provider]];
  if (!secret) return false;

  const received = headers.get(SIGNATURE_HEADER[provider]);
  if (!received) return false;

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Activate subscription only after successful, verified payment confirmation.
 * Must run ONLY on the server (webhook handler or admin action).
 * Persistence is not implemented yet: this only logs, so no access is granted.
 */
export async function activateSubscription(params: {
  userId: string;
  planId: string;
  providerPaymentId: string;
  provider: PaymentProvider;
  amountMinor: number;
}): Promise<{ subscriptionId: string; status: "active" }> {
  if (params.provider === "mock" && process.env.NODE_ENV === "production") {
    throw new Error("Refusing to activate a mock payment in production");
  }

  // TODO when the database exists:
  // 1. Insert into payments with a UNIQUE constraint on providerPaymentId
  //    (duplicate webhooks must not activate twice)
  // 2. Upsert subscriptions (status=active, starts_at, ends_at)
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  console.info("[VOOSITA] Subscription activated", {
    subscriptionId,
    userId: params.userId,
    planId: params.planId,
    providerPaymentId: params.providerPaymentId,
  });

  return { subscriptionId, status: "active" };
}
