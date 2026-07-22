import {
  createPendingSubscription,
  findLatestProviderSubscriptionForUser,
  updateSubscriptionProviderReference,
} from "./billing-service.js";
import {
  buildStripeRedirectUrls,
  getStripeClient,
  getStripePriceIdForPlan,
} from "./providers/stripe.js";

function customerName(user = {}) {
  return String(user.name || user.email || "TEKKNO reader").trim();
}

async function resolveStripeCustomer({ user, stripe }) {
  const existing = await findLatestProviderSubscriptionForUser(user.id, "stripe");
  if (existing?.providerCustomerId) return existing.providerCustomerId;

  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: customerName(user),
    metadata: { tekknoUserId: user.id },
  }, {
    idempotencyKey: `tekkno-stripe-customer-${user.id}`,
  });

  return customer.id;
}

export async function createStripeCheckoutSession({ user, plan, returnUrl, cancelUrl, env = process.env }) {
  const stripe = getStripeClient(env);
  const existing = await findLatestProviderSubscriptionForUser(user.id, "stripe");
  if (["active", "trialing"].includes(existing?.status)) {
    const error = new Error("You already have an active subscription.");
    error.status = 409;
    error.code = "SUBSCRIPTION_ALREADY_ACTIVE";
    throw error;
  }

  const existingSessionId = String(existing?.metadata?.stripeCheckoutSessionId || "").trim();
  if (existing?.status === "pending" && existing?.planKey === plan.planKey && existingSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(existingSessionId);
    if (existingSession.status === "open" && existingSession.url) {
      return {
        subscription: existing,
        sessionId: existingSession.id,
        checkoutUrl: existingSession.url,
      };
    }
  }

  const stripePriceId = getStripePriceIdForPlan(plan, env);
  const subscription = await createPendingSubscription({
    userId: user.id,
    planKey: plan.planKey,
    provider: "stripe",
    providerCustomerId: existing?.providerCustomerId || null,
    returnUrl,
    cancelUrl,
    metadata: { checkoutMode: "stripe_checkout", stripePriceId },
  });
  const customerId = subscription.providerCustomerId || await resolveStripeCustomer({ user, stripe });
  const redirectUrls = buildStripeRedirectUrls({ returnUrl, cancelUrl }, env);
  const taxRateId = String(env.STRIPE_SUBSCRIPTION_TAX_RATE_ID || "").trim();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: subscription.id,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: redirectUrls.successUrl,
    cancel_url: redirectUrls.cancelUrl,
    allow_promotion_codes: true,
    customer_update: { address: "auto" },
    metadata: {
      tekknoUserId: user.id,
      tekknoSubscriptionId: subscription.id,
      tekknoPlanKey: plan.planKey,
    },
    subscription_data: {
      metadata: {
        tekknoUserId: user.id,
        tekknoSubscriptionId: subscription.id,
        tekknoPlanKey: plan.planKey,
      },
      ...(taxRateId ? { default_tax_rates: [taxRateId] } : {}),
    },
  }, {
    idempotencyKey: `tekkno-stripe-checkout-${subscription.id}`,
  });

  const updated = await updateSubscriptionProviderReference(subscription.id, {
    providerCustomerId: customerId,
    metadata: {
      stripeCheckoutSessionId: session.id,
      stripeCheckoutCreatedAt: new Date().toISOString(),
      stripePriceId,
    },
  });

  return {
    subscription: updated || subscription,
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}
