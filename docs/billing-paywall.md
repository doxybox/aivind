# Billing And Paywall

Cloudflare media is parked until the customer activates and pays for the required Images/Stream quotas. This document covers the payment-independent subscription and paywall core.

## Current Access Model

Article access is resolved server-side before article props are serialized:

- `accessLevel=public` and `paywallEnabled=false`: everyone can read.
- `accessLevel=members` and `paywallEnabled=false`: any logged-in user can read.
- `accessLevel=paid` or `paywallEnabled=true`: requires active subscription or active entitlement.
- `admin`, `editor` and `journalist` roles can read restricted articles for staff workflows.

Premium body content is removed from serialized props when access is not granted.

## Provider-Neutral Data Model

The current app tables are provider-neutral:

- `subscription.provider`: `manual`, `vipps`, `stripe`, or another future provider.
- `subscription.providerCustomerId`: external customer id.
- `subscription.providerSubscriptionId`: external subscription id, Vipps agreement id, or Stripe subscription id.
- `subscription.providerChargeId`: external charge/payment id when relevant.
- `subscription.status`: `active`, `trialing`, `past_due`, `cancelled`, `expired`.
- `subscription.currentPeriodStart` / `subscription.currentPeriodEnd`: active access window.
- `subscription.planKey`: canonical plan key, for example `premium_monthly`.
- `subscription.entitlementKey`: entitlement derived from the plan, for example `premium`.
- `subscription.metadata`: provider/debug metadata that is safe to store server-side.
- `entitlement.type`: entitlement key, for example `premium`, `premium_articles`, `premium_article:<articleId>`.
- `entitlement.active`, `startsAt`, `endsAt`: entitlement validity.
- `billing_event`: provider webhook idempotency log.

Authentication says who the user is. Subscription and entitlement rows decide what the user can read.

## Billing Core

The provider-neutral billing layer is split into:

- `src/lib/billing-plans.js`: plan catalog.
- `src/lib/server/billing/billing-core.js`: validation and pure billing rules.
- `src/lib/server/billing/billing-service.js`: subscription and entitlement writes.
- `POST /api/billing/checkout`: provider-neutral checkout start.
- `POST /api/billing/subscription/status`: authenticated server-side provider status check.
- `POST /api/billing/webhooks/vipps`: verified Vipps webhook handling.

Entitlement is derived from subscription status. Client-side state must never grant premium access.

Checkout redirects are path-only. The client may only request internal paths on the allowlist:

- `/abonnement/status`
- `/abonnement`
- `/min-side`

The server builds full merchant URLs from trusted environment origin values. Arbitrary client-supplied absolute URLs such as `https://...`, `//...`, `javascript:` or backslash variants are rejected/fallbacked.

`POST /api/billing/checkout` also performs a minimal same-origin check for state-changing browser requests. Full CSRF coverage for every app API is still a production hardening item.

Current plan keys:

- `premium_monthly`
- `premium_yearly`

## Dev/Test Entitlement

For local QA without payments:

```bash
ALLOW_TEST_ENTITLEMENT_GRANT=true npm run auth:grant-test-entitlement -- <better-auth-user-id> premium 30
```

The script refuses to run when `NODE_ENV=production` and does nothing unless `ALLOW_TEST_ENTITLEMENT_GRANT=true` is set.

## Vipps Recurring Test Flow

Vipps Recurring is implemented for test credentials only, but payment runtime-QA is currently parked. If `BILLING_PROVIDER` or required Vipps credentials are missing, checkout returns a safe disabled response and does not create a pending subscription row.

Before production activation, the customer must provide:

- Vipps merchant account
- Vipps recurring agreement credentials
- callback/webhook URLs
- product/plan mapping
- production credentials and a signed-off production launch plan

Vipps creates a pending `subscription` row, redirects the user to Vipps, then updates `subscription` and `entitlement` only from server-side Vipps status checks or verified webhooks. Client state must never grant premium access.

Required test env vars:

```env
BILLING_PROVIDER=vipps
VIPPS_ENV=test
VIPPS_BASE_URL=https://apitest.vipps.no
VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_SUBSCRIPTION_KEY=
VIPPS_MERCHANT_SERIAL_NUMBER=
VIPPS_WEBHOOK_SECRET=
VIPPS_RETURN_URL=http://localhost:3000/abonnement/status
VIPPS_CANCEL_URL=http://localhost:3000/abonnement
VIPPS_WEBHOOK_URL=https://<public-dev-url>/api/billing/webhooks/vipps
```

Webhook URL to register later:

```txt
https://<domain>/api/billing/webhooks/vipps
```

Current status mapping target:

- Vipps agreement active -> `subscription.status=active`
- Vipps agreement stopped/cancelled -> `subscription.status=cancelled`
- Vipps agreement expired -> `subscription.status=expired`
- payment problem -> `subscription.status=past_due`

The production Vipps environment is intentionally blocked until the customer-owned setup is ready.

## Future Stripe Billing

Stripe can be added later using the same model:

- Stripe customer id -> `providerCustomerId`
- Stripe subscription id -> `providerSubscriptionId`
- Stripe price/product -> `planType`
- verified Stripe webhooks -> subscription and entitlement updates

Likely env vars:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Remaining Before Production Payments

- Run end-to-end QA with customer-owned Vipps test credentials.
- Register a public webhook URL in Vipps.
- Add operational retries/monitoring for webhook failures.
- Add customer portal/cancel flow.
- Enable production env only after launch approval.
