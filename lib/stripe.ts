import Stripe from "stripe";
import { getEnv } from "./env";

const stripeSecret = getEnv("STRIPE_SECRET_KEY");
const stripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");

let stripe: Stripe | null = null;

function getStripe() {
  if (!stripeSecret) {
    return null;
  }
  if (!stripe) {
    stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });
  }
  return stripe;
}

export async function createPaymentIntent({
  amount,
  currency,
  metadata,
}: {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}) {
  const client = getStripe();
  if (!client) {
    // TODO: Paste Stripe key in .env.local when ready.
    return { id: "demo", client_secret: "demo_secret" };
  }
  const intent = await client.paymentIntents.create({ amount, currency, metadata });
  return { id: intent.id, client_secret: intent.client_secret };
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  const client = getStripe();
  if (!client) {
    return { id: "demo_refund" };
  }
  const refund = await client.refunds.create({ payment_intent: paymentIntentId, amount });
  return { id: refund.id };
}

export async function handleStripeWebhook(payload: string, signature: string) {
  const client = getStripe();
  if (!client || !stripeWebhookSecret) {
    return { ok: true };
  }

  const event = client.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  return { ok: true, event };
}
