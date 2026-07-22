# Stripe Billing Runbook

## Scope and authority

Stripe is the authority for payment, invoices, receipts, refunds, credit notes and subscription status.
The `subscription` and `entitlement` tables are a local, server-side access copy. The public client
never receives a Price ID input path and never grants itself access after a checkout redirect.

`invoice.paid` is the event that grants subscription-derived premium access. A successful redirect is
only a confirmation that the customer returned from Checkout. `invoice.payment_failed` records a
non-entitling status, while `customer.subscription.updated` and
`customer.subscription.deleted` synchronize cancellation and end-of-access state.

## Required environment

Set these as server-side values in the deployment platform. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is
the only Stripe value that may be exposed to the browser, and is not used to decide access.

```env
BILLING_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
STRIPE_SUBSCRIPTION_TAX_RATE_ID=
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://staging.tekkno.no/min-side
NEXT_PUBLIC_APP_URL=https://staging.tekkno.no
```

For each sellable plan, set Payload Admin > Subscription plans > Payment provider > Stripe Price ID.
The monthly and yearly environment values are only safe fallbacks for plans that deliberately use the
matching interval. Do not put secret keys in Payload, client JavaScript or source control.

## Stripe Dashboard checklist

Before enabling billing, an owner must configure and verify:

- Products and recurring NOK Prices for every checkout-enabled plan.
- Customer Portal with payment-method updates, invoice history and cancellation at period end enabled.
- Customer email receipts for successful payments, failed payments and refunds.
- Legal business name, organization number, address, support email, invoice prefix and account-level
  sequential invoice numbering.
- A webhook endpoint at `https://<domain>/api/stripe/webhook` for
  `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted` and `charge.refunded`.
- Tax configuration approved by the accountant or tax adviser. Leave the tax-rate environment value
  empty until the applicable treatment is approved. Subscription and advertising tax rates can differ.

Stripe Dashboard remains the place for refunds, credit notes, invoice corrections, Balance reports,
Payout reconciliation, Invoice reports and Tax reports. The application must not rewrite historic
payments or generate duplicate invoice PDFs.

## Database migration

Take a verified backup before migrating, then run:

```bash
npm run db:migrate
npm run payload:migrate
```

The Drizzle migration is additive: it adds Stripe Price, cancellation and webhook event fields. The
Payload migration adds an editor-managed Stripe Price ID to existing subscription plans. The named
migration/deploy owner performs these commands and records the result.

## Local webhook test

Use Stripe test keys only during local development:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the displayed `whsec_...` value into local `STRIPE_WEBHOOK_SECRET`, restart the app, sign in and
start Checkout from `/abonnement`. Use Stripe test cards and inspect the returned webhook events.
`stripe trigger` is useful for signature and delivery checks, but full access QA must use a real test
Checkout Session because it carries the application subscription metadata.

## Manual acceptance test

1. Set a test Price ID on a checkout-enabled Payload plan and enable `BILLING_PROVIDER=stripe`.
2. Sign in as a reader and start Checkout. Confirm the client cannot submit a different Price ID.
3. Complete test checkout. Confirm the return page remains pending until `invoice.paid` is delivered.
4. Confirm a verified `invoice.paid` creates/updates the local subscription and entitlement and opens
   a premium article.
5. Redeliver the same webhook. Confirm `billing_event` records it once and the duplicate is ignored.
6. Trigger a failed payment and cancellation. Confirm premium access is not granted or is removed when
   Stripe marks the subscription non-entitling, without changing journalist, editor or admin roles.
7. Open Customer Portal from `/min-side`; update a test payment method, inspect invoice history and
   schedule cancellation at period end.
8. Confirm a direct Dashboard-created subscription contains `tekknoUserId` metadata or is manually
   linked before it can grant access. Unlinked Stripe subscriptions are intentionally not assigned.

## Operational notes

- Webhook logs store only event ID, type, status, a payload hash and application user linkage. Do not
  log card data or full production webhook bodies.
- Stripe's idempotency keys protect customer and checkout creation from double-clicks.
- If Stripe is not fully configured, keep `BILLING_PROVIDER` empty. Existing billing UI stays disabled
  rather than pretending payment is available.
- Customer Portal is the only supported self-service route for card changes, invoice downloads and
  cancellation. No application endpoint accepts raw card data.
