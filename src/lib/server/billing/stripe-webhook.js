import { createHash } from "node:crypto";
import {
  claimBillingEvent,
  completeBillingEvent,
  failBillingEvent,
  findSubscriptionById,
  findSubscriptionByProviderId,
  syncStripeSubscription,
  updateSubscriptionProviderReference,
} from "./billing-service.js";
import { getStripeBillingConfig, getStripeClient } from "./providers/stripe.js";

export function hashStripeWebhookPayload(rawBody) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function metadataUserId(value) {
  return String(value?.metadata?.tekknoUserId || value?.metadata?.userId || "").trim() || null;
}

async function resolveUserId({ stripe, stripeSubscription, localSubscription }) {
  if (localSubscription?.userId) return localSubscription.userId;
  const fromSubscription = metadataUserId(stripeSubscription);
  if (fromSubscription) return fromSubscription;

  const customerId = typeof stripeSubscription?.customer === "string"
    ? stripeSubscription.customer
    : stripeSubscription?.customer?.id;
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  return customer.deleted ? null : metadataUserId(customer);
}

async function syncSubscriptionById({ stripe, providerSubscriptionId, userId = null, statusOverride = null, metadata = {} }) {
  if (!providerSubscriptionId) return null;
  const stripeSubscription = await stripe.subscriptions.retrieve(providerSubscriptionId);
  const localSubscription = await findSubscriptionByProviderId("stripe", providerSubscriptionId);
  const linkedUserId = userId || await resolveUserId({ stripe, stripeSubscription, localSubscription });
  const effectiveSubscription = statusOverride
    ? { ...stripeSubscription, status: statusOverride }
    : stripeSubscription;

  try {
    return await syncStripeSubscription({
      stripeSubscription: effectiveSubscription,
      userId: linkedUserId,
      planKey: String(stripeSubscription.metadata?.tekknoPlanKey || "").trim() || null,
      metadata,
    });
  } catch (error) {
    // A subscription created manually in Stripe without an app user or mapped Price
    // must never grant access, but it is a completed webhook delivery rather than a retry loop.
    if (["STRIPE_USER_LINK_MISSING", "STRIPE_PLAN_MAPPING_MISSING"].includes(error?.code)) return null;
    throw error;
  }
}

async function processStripeEvent(event, stripe) {
  const object = event.data?.object || {};

  if (event.type === "checkout.session.completed") {
    const localSubscriptionId = String(object.metadata?.tekknoSubscriptionId || object.client_reference_id || "").trim();
    const providerSubscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    if (!localSubscriptionId || !providerSubscriptionId) return { status: "checkout_link_missing" };

    const localSubscription = await findSubscriptionById(localSubscriptionId);
    if (!localSubscription) return { status: "checkout_local_subscription_missing" };
    await updateSubscriptionProviderReference(localSubscriptionId, {
      providerCustomerId: typeof object.customer === "string" ? object.customer : object.customer?.id || null,
      providerSubscriptionId,
      metadata: { stripeCheckoutSessionId: object.id || null },
    });
    return { status: "checkout_linked", providerSubscriptionId };
  }

  if (event.type === "invoice.paid") {
    const providerSubscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    const subscription = await syncSubscriptionById({
      stripe,
      providerSubscriptionId,
      metadata: { stripeInvoiceId: object.id || null, stripeInvoiceStatus: object.status || "paid" },
    });
    return { status: subscription?.status || "invoice_without_subscription", providerSubscriptionId };
  }

  if (event.type === "invoice.payment_failed") {
    const providerSubscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    const subscription = await syncSubscriptionById({
      stripe,
      providerSubscriptionId,
      statusOverride: "past_due",
      metadata: { stripeInvoiceId: object.id || null, stripeInvoiceStatus: object.status || "payment_failed" },
    });
    return { status: subscription?.status || "invoice_without_subscription", providerSubscriptionId };
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = await syncSubscriptionById({
      stripe,
      providerSubscriptionId: object.id,
      userId: metadataUserId(object),
      statusOverride: event.type === "customer.subscription.deleted" ? "canceled" : null,
      metadata: { stripeWebhookEventType: event.type },
    });
    return { status: subscription?.status || "subscription_not_linked", providerSubscriptionId: object.id || null };
  }

  if (event.type === "charge.refunded") {
    return { status: "refund_recorded", providerSubscriptionId: null };
  }

  return { status: "ignored", providerSubscriptionId: null };
}

export async function handleVerifiedStripeEvent(event, rawBody, env = process.env) {
  const providerSubscriptionId = String(
    event.data?.object?.subscription || event.data?.object?.id || "",
  ).trim() || null;
  const claimed = await claimBillingEvent({
    provider: "stripe",
    eventId: event.id,
    providerSubscriptionId,
    eventType: event.type,
    status: "received",
    payloadHash: hashStripeWebhookPayload(rawBody),
    eventCreatedAt: event.created ? new Date(event.created * 1000) : null,
  });

  if (!claimed.claimed) return { duplicate: true, status: "duplicate" };

  try {
    const result = await processStripeEvent(event, getStripeClient(env));
    await completeBillingEvent("stripe", event.id, result.status);
    return { duplicate: false, ...result };
  } catch (error) {
    await failBillingEvent("stripe", event.id, error?.code || "stripe_event_processing_failed");
    throw error;
  }
}

export function constructVerifiedStripeEvent(rawBody, signature, env = process.env) {
  const { webhookSecret } = getStripeBillingConfig(env);
  if (!signature) {
    const error = new Error("Missing Stripe signature");
    error.status = 400;
    throw error;
  }
  return getStripeClient(env).webhooks.constructEvent(rawBody, signature, webhookSecret);
}
