import Stripe from "stripe";
import { getEnv, isProd } from "./env";

const stripeSecret = getEnv("STRIPE_SECRET_KEY");
const stripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
const paymentsFlag = getEnv("FEATURE_PAYMENTS").toLowerCase();
const paymentsEnabled = paymentsFlag
  ? paymentsFlag === "true"
  : isProd();

let stripe: Stripe | null = null;

export function isPaymentsEnabled() {
  return paymentsEnabled;
}

function assertStripeReady() {
  if (!paymentsEnabled) {
    throw new Error("Payments are disabled");
  }
  const missing: string[] = [];
  if (!stripeSecret) {
    missing.push("STRIPE_SECRET_KEY");
  }
  if (!stripeWebhookSecret) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }
  if (missing.length) {
    throw new Error(`Stripe is not configured (${missing.join(", ")})`);
  }
}

function getStripeClient() {
  if (!stripe) {
    stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });
  }
  return stripe;
}

export async function createPaymentIntent({
  amount,
  currency,
  metadata,
  idempotencyKey,
}: {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  idempotencyKey?: string | null;
}) {
  assertStripeReady();
  const client = getStripeClient();
  const intent = await client.paymentIntents.create(
    { amount, currency, metadata },
    idempotencyKey ? { idempotencyKey } : undefined
  );
  return { id: intent.id, client_secret: intent.client_secret };
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  idempotencyKey?: string | null
) {
  assertStripeReady();
  const client = getStripeClient();
  const refund = await client.refunds.create(
    { payment_intent: paymentIntentId, amount },
    idempotencyKey ? { idempotencyKey } : undefined
  );
  return { id: refund.id };
}

export async function handleStripeWebhook(payload: string, signature: string): Promise<{ ok: true; event: Stripe.Event }> {
  assertStripeReady();
  const client = getStripeClient();
  const event = client.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  return { ok: true, event };
}
