import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import Stripe from "stripe";
import {
  buildStripeRedirectUrls,
  getStripePriceIdForPlan,
  normalizeStripeSubscriptionStatus,
} from "../src/lib/server/billing/providers/stripe.js";

const rootDir = process.cwd();
const stripeEnv = {
  STRIPE_SECRET_KEY: "sk_test_unit_test_key",
  STRIPE_WEBHOOK_SECRET: "whsec_unit_test_secret",
  STRIPE_MONTHLY_PRICE_ID: "price_monthlyfallback",
  STRIPE_YEARLY_PRICE_ID: "price_yearlyfallback",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("Stripe price resolution is server-side and rejects missing or malformed plan prices", () => {
  assert.equal(
    getStripePriceIdForPlan({ interval: "monthly", stripe: { priceId: "price_payloadprice" } }, stripeEnv),
    "price_payloadprice",
  );
  assert.equal(
    getStripePriceIdForPlan({ interval: "yearly", stripe: {} }, stripeEnv),
    "price_yearlyfallback",
  );
  assert.throws(
    () => getStripePriceIdForPlan({ interval: "monthly", stripe: { priceId: "arbitrary-client-price" } }, stripeEnv),
    /Price ID is not configured/,
  );
});

test("Stripe checkout redirects stay on the configured application origin", () => {
  const urls = buildStripeRedirectUrls({
    returnUrl: "/abonnement/status",
    cancelUrl: "/abonnement",
  }, stripeEnv);
  assert.equal(urls.cancelUrl, "http://localhost:3000/abonnement");
  assert.match(urls.successUrl, /^http:\/\/localhost:3000\/abonnement\/status\?checkout=/);
});

test("Stripe webhook verification rejects an invalid signature", () => {
  const rawBody = Buffer.from(JSON.stringify({ id: "evt_unit", type: "invoice.paid", data: { object: {} } }));
  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY);
  assert.throws(
    () => stripe.webhooks.constructEvent(rawBody, "t=1,v1=invalid", stripeEnv.STRIPE_WEBHOOK_SECRET),
    /No signatures found matching|Unable to extract timestamp/i,
  );
});

test("Stripe webhook verification accepts a signed raw payload", () => {
  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY);
  const rawBody = JSON.stringify({ id: "evt_unit", type: "invoice.paid", data: { object: {} } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret: stripeEnv.STRIPE_WEBHOOK_SECRET });
  const event = stripe.webhooks.constructEvent(Buffer.from(rawBody), signature, stripeEnv.STRIPE_WEBHOOK_SECRET);
  assert.equal(event.id, "evt_unit");
});

test("Stripe statuses only grant access for active or trialing subscriptions", () => {
  assert.equal(normalizeStripeSubscriptionStatus("active"), "active");
  assert.equal(normalizeStripeSubscriptionStatus("trialing"), "trialing");
  assert.equal(normalizeStripeSubscriptionStatus("past_due"), "past_due");
  assert.equal(normalizeStripeSubscriptionStatus("unexpected"), "pending");
});

test("Stripe routes require raw webhook verification and authenticated account actions", () => {
  const webhook = readProjectFile("src/pages/api/stripe/webhook.js");
  const checkout = readProjectFile("src/pages/api/stripe/create-checkout-session.js");
  const portal = readProjectFile("src/pages/api/stripe/create-portal-session.js");
  const handler = readProjectFile("src/lib/server/billing/stripe-webhook.js");

  assert.match(webhook, /bodyParser:\s*false/);
  assert.match(webhook, /constructVerifiedStripeEvent/);
  assert.match(checkout, /requireAuth\(req\)/);
  assert.doesNotMatch(checkout, /req\.body\.price|req\.body\.priceId|req\.body\.userId/);
  assert.match(portal, /requireAuth\(req\)/);
  assert.match(handler, /claimBillingEvent/);
  assert.match(handler, /invoice\.paid/);
  assert.match(handler, /invoice\.payment_failed/);
  assert.match(handler, /customer\.subscription\.deleted/);
});
