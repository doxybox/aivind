import Stripe from "stripe";
import { buildCheckoutUrl, getSiteOrigin } from "../billing-core.js";

export class StripeBillingNotConfiguredError extends Error {
  constructor(missing = []) {
    super("Stripe is not configured in this environment.");
    this.name = "StripeBillingNotConfiguredError";
    this.status = 503;
    this.code = "STRIPE_NOT_CONFIGURED";
    this.missing = missing;
  }
}

let cachedClient = null;
let cachedKey = "";

function requiredValue(env, key) {
  return String(env?.[key] || "").trim();
}

export function getStripeBillingConfig(env = process.env) {
  const secretKey = requiredValue(env, "STRIPE_SECRET_KEY");
  const webhookSecret = requiredValue(env, "STRIPE_WEBHOOK_SECRET");
  const missing = [
    !secretKey && "STRIPE_SECRET_KEY",
    !webhookSecret && "STRIPE_WEBHOOK_SECRET",
  ].filter(Boolean);

  if (missing.length) throw new StripeBillingNotConfiguredError(missing);

  return {
    secretKey,
    webhookSecret,
    customerPortalReturnUrl: requiredValue(env, "STRIPE_CUSTOMER_PORTAL_RETURN_URL")
      || buildCheckoutUrl("/min-side", env),
    defaultMonthlyPriceId: requiredValue(env, "STRIPE_MONTHLY_PRICE_ID") || null,
    defaultYearlyPriceId: requiredValue(env, "STRIPE_YEARLY_PRICE_ID") || null,
    subscriptionTaxRateId: requiredValue(env, "STRIPE_SUBSCRIPTION_TAX_RATE_ID") || null,
    origin: getSiteOrigin(env),
  };
}

export function getStripeClient(env = process.env) {
  const { secretKey } = getStripeBillingConfig(env);
  if (!cachedClient || cachedKey !== secretKey) {
    cachedClient = new Stripe(secretKey, {
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
    cachedKey = secretKey;
  }
  return cachedClient;
}

export function getStripePriceIdForPlan(plan, env = process.env) {
  const config = getStripeBillingConfig(env);
  const configuredPriceId = String(plan?.stripe?.priceId || "").trim()
    || (plan?.interval === "monthly" ? config.defaultMonthlyPriceId : null)
    || (plan?.interval === "yearly" ? config.defaultYearlyPriceId : null);

  if (!/^price_[A-Za-z0-9]+$/.test(configuredPriceId || "")) {
    const error = new Error("Stripe Price ID is not configured for this plan.");
    error.status = 503;
    error.code = "STRIPE_PRICE_NOT_CONFIGURED";
    throw error;
  }

  return configuredPriceId;
}

export function buildStripeRedirectUrls({ returnUrl, cancelUrl }, env = process.env) {
  const successUrl = new URL(buildCheckoutUrl(returnUrl, env));
  successUrl.searchParams.set("checkout", "{CHECKOUT_SESSION_ID}");

  return {
    successUrl: successUrl.toString(),
    cancelUrl: buildCheckoutUrl(cancelUrl, env),
  };
}

export function normalizeStripeSubscriptionStatus(status) {
  const clean = String(status || "").trim().toLowerCase();
  return [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "paused",
  ].includes(clean) ? clean : "pending";
}

export function resetStripeClientForTests() {
  cachedClient = null;
  cachedKey = "";
}
