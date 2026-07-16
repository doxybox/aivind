import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildSubscriptionPlanCards,
  serializeSubscriptionPlan,
} from "../src/lib/server/billing/subscription-plan-catalog.js";
import {
  buildEntitlementSource,
  cleanCheckoutPath,
  getBillingCheckoutStatus,
  getSubscriptionEntitlementKey,
  isSubscriptionEntitling,
  validateCheckoutInput,
} from "../src/lib/server/billing/billing-core.js";
import {
  buildVippsAgreementPayload,
  buildVippsWebhookSignature,
  createAgreement,
  getVippsAccessToken,
  getVippsRecurringConfig,
  hashRawBody,
  resetVippsAccessTokenCacheForTests,
  validateVippsWebhookRequest,
  VippsRecurringNotConfiguredError,
} from "../src/lib/server/billing/providers/vipps-recurring.js";

const rootDir = process.cwd();
const vippsEnv = {
  VIPPS_ENV: "test",
  VIPPS_BASE_URL: "https://apitest.vipps.no",
  VIPPS_CLIENT_ID: "client-id",
  VIPPS_CLIENT_SECRET: "client-secret",
  VIPPS_SUBSCRIPTION_KEY: "sub-key",
  VIPPS_MERCHANT_SERIAL_NUMBER: "merchant-serial",
  VIPPS_WEBHOOK_SECRET: "webhook-secret",
  VIPPS_RETURN_URL: "http://localhost:3000/abonnement/status",
  VIPPS_CANCEL_URL: "http://localhost:3000/abonnement",
  VIPPS_WEBHOOK_URL: "https://example.test/api/billing/webhooks/vipps",
};

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

const premiumMonthlyPlan = {
  planKey: "premium_monthly",
  displayGroup: "premium",
  displayName: "TEKKNO Premium",
  description: "For ekspertene",
  price: 299,
  currency: "NOK",
  interval: "monthly",
  entitlementKey: "premium",
  checkoutMode: "checkout",
  features: ["Premium-artikler"],
  provider: {
    vippsProductId: "tekkno-premium-monthly",
    vippsAgreementProductName: "TEKKNO Premium manedlig",
  },
  isActive: true,
};

const premiumYearlyPlan = {
  ...premiumMonthlyPlan,
  planKey: "premium_yearly",
  price: 2990,
  interval: "yearly",
  provider: {
    vippsProductId: "tekkno-premium-yearly",
    vippsAgreementProductName: "TEKKNO Premium arlig",
  },
};

async function resolveTestPlan(planKey) {
  if (planKey === premiumMonthlyPlan.planKey) return premiumMonthlyPlan;
  if (planKey === premiumYearlyPlan.planKey) return premiumYearlyPlan;
  return null;
}

test("subscription plan catalog normalizes Payload plans and groups billing intervals", () => {
  const monthly = serializeSubscriptionPlan(premiumMonthlyPlan);
  const yearly = serializeSubscriptionPlan(premiumYearlyPlan);
  const [premium] = buildSubscriptionPlanCards([monthly, yearly]);

  assert.equal(monthly.entitlementKey, "premium");
  assert.equal(monthly.currency, "NOK");
  assert.equal(monthly.interval, "monthly");
  assert.equal(yearly.interval, "yearly");
  assert.equal(premium.monthlyPrice, 299);
  assert.equal(premium.yearlyPrice, 2990);
  assert.equal(premium.monthlyPlanKey, "premium_monthly");
  assert.equal(premium.yearlyPlanKey, "premium_yearly");
});

test("checkout input rejects invalid planKey and only allows internal checkout paths", async () => {
  await assert.rejects(
    () => validateCheckoutInput({ planKey: "free" }, { resolvePlan: resolveTestPlan }),
    /Invalid planKey/,
  );
  await assert.rejects(
    () => validateCheckoutInput({ planKey: "does-not-exist" }, { resolvePlan: resolveTestPlan }),
    /Invalid planKey/,
  );

  const clean = await validateCheckoutInput({
    planKey: "premium_monthly",
    returnUrl: "/abonnement/status?subscription=ok",
    cancelUrl: "javascript:alert(1)",
  }, { resolvePlan: resolveTestPlan });

  assert.equal(clean.plan.planKey, "premium_monthly");
  assert.equal(clean.returnUrl, "/abonnement/status?subscription=ok");
  assert.equal(clean.cancelUrl, "/abonnement");
  assert.equal(cleanCheckoutPath("https://evil.example/pay", "/abonnement"), "/abonnement");
  assert.equal(cleanCheckoutPath("//evil.example/pay", "/abonnement"), "/abonnement");
  assert.equal(cleanCheckoutPath("/%2fevil.example/pay", "/abonnement"), "/abonnement");
  assert.equal(cleanCheckoutPath("/\\evil.example", "/abonnement"), "/abonnement");
  assert.equal(cleanCheckoutPath("/admin", "/abonnement"), "/abonnement");
});

test("billing checkout status is disabled until provider config is explicit", () => {
  const disabled = getBillingCheckoutStatus({});
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.code, "BILLING_NOT_CONFIGURED");
  assert.equal(disabled.message, "Betaling er ikke aktivert i dette miljøet.");
  assert.equal(getBillingCheckoutStatus({ BILLING_PROVIDER: "vipps" }).code, "VIPPS_NOT_CONFIGURED");
  assert.equal(getBillingCheckoutStatus({ BILLING_PROVIDER: "vipps" }).message, "Betaling er ikke aktivert i dette miljøet.");
  assert.equal(getBillingCheckoutStatus({ BILLING_PROVIDER: "test" }).enabled, false);
  assert.equal(getBillingCheckoutStatus({ BILLING_PROVIDER: "test", ALLOW_TEST_BILLING_CHECKOUT: "true" }).enabled, true);
});

test("abonnement page presents parked billing without active provider copy", () => {
  const source = readProjectFile("src/pages/abonnement.page.jsx");

  assert.match(source, /Betaling er parkert i dette miljøet/);
  assert.match(source, /if \(!checkoutEnabled\)/);
  assert.match(source, /Betaling ikke aktivert/);
  assert.doesNotMatch(source, /Vipps Recurring kobles/);
});

test("subscription status controls entitlement eligibility", () => {
  const now = new Date("2026-06-29T12:00:00Z");
  const active = {
    id: "sub-1",
    status: "active",
    planKey: "premium_monthly",
    entitlementKey: "premium",
    currentPeriodStart: new Date("2026-06-01T12:00:00Z"),
    currentPeriodEnd: new Date("2026-07-01T12:00:00Z"),
  };

  assert.equal(isSubscriptionEntitling(active, now), true);
  assert.equal(getSubscriptionEntitlementKey(active), "premium");
  assert.equal(buildEntitlementSource(active.id), "subscription:sub-1");
  assert.equal(isSubscriptionEntitling({ ...active, status: "cancelled" }, now), false);
  assert.equal(isSubscriptionEntitling({ ...active, status: "expired" }, now), false);
  assert.equal(isSubscriptionEntitling({ ...active, currentPeriodEnd: new Date("2026-06-02T12:00:00Z") }, now), false);
});

test("Vipps config is test-only and requires credentials", () => {
  assert.throws(() => getVippsRecurringConfig({}), VippsRecurringNotConfiguredError);
  assert.throws(
    () => getVippsRecurringConfig({ ...vippsEnv, VIPPS_ENV: "production" }),
    /Only Vipps test environment/,
  );

  const config = getVippsRecurringConfig(vippsEnv);
  assert.equal(config.env, "test");
  assert.equal(config.baseUrl, "https://apitest.vipps.no");
  assert.equal(config.webhookUrl, "https://example.test/api/billing/webhooks/vipps");
});

test("Vipps access token exchange sends required headers", async () => {
  resetVippsAccessTokenCacheForTests();
  const calls = [];
  const token = await getVippsAccessToken({
    env: vippsEnv,
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: "access-token", expires_in: 3600 }),
      };
    },
  });

  assert.equal(token, "access-token");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://apitest.vipps.no/accesstoken/get");
  assert.equal(calls[0].options.headers.client_id, "client-id");
  assert.equal(calls[0].options.headers.client_secret, "client-secret");
  assert.equal(calls[0].options.headers["Ocp-Apim-Subscription-Key"], "sub-key");
  assert.equal(calls[0].options.headers["Merchant-Serial-Number"], "merchant-serial");
});

test("Vipps agreement creation builds agreement payload and returns confirmation URL", async () => {
  resetVippsAccessTokenCacheForTests();
  const calls = [];
  const plan = premiumMonthlyPlan;
  const subscription = { id: "local-subscription-id" };
  const result = await createAgreement({
    env: vippsEnv,
    user: { email: "reader@example.test" },
    plan,
    subscription,
    returnUrl: "/abonnement/status",
    cancelUrl: "/abonnement",
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/accesstoken/get")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "access-token", expires_in: 3600 }),
        };
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({
          agreementId: "vipps-agreement-id",
          vippsConfirmationUrl: "https://vipps.test/confirm",
        }),
      };
    },
  });

  assert.equal(result.agreementId, "vipps-agreement-id");
  assert.equal(result.confirmationUrl, "https://vipps.test/confirm");
  assert.equal(calls[1].url, "https://apitest.vipps.no/recurring/v3/agreements");
  assert.equal(calls[1].options.headers["Idempotency-Key"], "local-subscription-id");

  const agreementBody = JSON.parse(calls[1].options.body);
  assert.equal(agreementBody.externalId, "local-subscription-id");
  assert.equal(agreementBody.merchantRedirectUrl, "http://localhost:3000/abonnement/status");
  assert.equal(agreementBody.merchantAgreementUrl, "http://localhost:3000/abonnement");
  assert.equal(agreementBody.pricing.amount, 29900);
  assert.deepEqual(agreementBody.interval, { unit: "MONTH", count: 1 });
  assert.deepEqual(agreementBody.customer, { email: "reader@example.test" });
});

test("Vipps agreement payload maps yearly interval", () => {
  const payload = buildVippsAgreementPayload({
    user: {},
    plan: premiumYearlyPlan,
    subscription: { id: "sub-year" },
    config: getVippsRecurringConfig(vippsEnv),
  });

  assert.equal(payload.pricing.amount, 299000);
  assert.deepEqual(payload.interval, { unit: "YEAR", count: 1 });
});

test("Vipps webhook signature validation rejects invalid payloads and accepts signed raw body", () => {
  const rawBody = JSON.stringify({ agreementId: "vipps-agreement-id", eventType: "agreement.updated" });
  const contentSha256 = hashRawBody(rawBody);
  const req = {
    method: "POST",
    url: "/api/billing/webhooks/vipps",
    headers: {
      host: "localhost:3000",
      "x-ms-date": "Mon, 29 Jun 2026 12:00:00 GMT",
      "x-ms-content-sha256": contentSha256,
    },
  };
  const signature = buildVippsWebhookSignature({
    method: req.method,
    pathAndQuery: req.url,
    host: req.headers.host,
    xMsDate: req.headers["x-ms-date"],
    contentSha256,
    secret: vippsEnv.VIPPS_WEBHOOK_SECRET,
  });

  const previousEnv = Object.fromEntries(Object.keys(vippsEnv).map((key) => [key, process.env[key]]));
  Object.assign(process.env, vippsEnv);
  try {
    assert.throws(
      () => validateVippsWebhookRequest({ ...req, headers: { ...req.headers, authorization: "bad" } }, rawBody),
      /Invalid Vipps webhook signature/,
    );

    const body = validateVippsWebhookRequest(
      { ...req, headers: { ...req.headers, authorization: `HMAC-SHA256 Signature=${signature}` } },
      rawBody,
    );
    assert.equal(body.agreementId, "vipps-agreement-id");
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("checkout endpoint creates pending Vipps subscription before agreement and never trusts client user id", () => {
  const source = readProjectFile("src/pages/api/billing/checkout.js");

  assert.match(source, /requireAuth\(req\)/);
  assert.match(source, /session\.user\.id/);
  assert.match(source, /await validateCheckoutInput/);
  assert.doesNotMatch(source, /req\.body\.userId|user_id/);
  assert.match(source, /createPendingSubscription/);
  assert.match(source, /createVippsRecurringAgreement/);
  assert.match(source, /updateSubscriptionProviderReference/);
  assert.match(source, /vippsConfirmationUrl/);
});

test("subscription status endpoint requires auth and verifies Vipps status server-side", () => {
  const source = readProjectFile("src/pages/api/billing/subscription/status.js");

  assert.match(source, /requireAuth\(req\)/);
  assert.match(source, /getCurrentUserSubscription\(session\.user\.id\)/);
  assert.doesNotMatch(source, /req\.body\.userId|user_id/);
  assert.match(source, /fetchVippsRecurringAgreement/);
  assert.match(source, /syncVippsAgreementStatusToSubscription/);
});

test("Vipps webhook endpoint uses raw body, signature validation and idempotency", () => {
  const webhook = readProjectFile("src/pages/api/billing/webhooks/vipps.js");
  const migration = readProjectFile("drizzle/0005_billing_event_idempotency.sql");

  assert.match(webhook, /bodyParser:\s*false/);
  assert.match(webhook, /validateVippsWebhookRequest\(req, rawBody\)/);
  assert.match(webhook, /recordBillingEvent/);
  assert.match(webhook, /duplicate: true/);
  assert.match(webhook, /fetchVippsRecurringAgreement/);
  assert.match(webhook, /syncVippsAgreementStatusToSubscription/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "billing_event"/);
});
