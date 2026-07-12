# Vipps MobilePay Recurring

Vipps MobilePay Recurring is implemented as the first provider for the provider-neutral billing core. This implementation is limited to the Vipps test environment until production credentials, product setup and operational routines are approved.

## Current State

Implemented:

- Vipps test environment config validation.
- Access token exchange against Vipps.
- Recurring agreement creation from `POST /api/billing/checkout`.
- Pending local `subscription` row before redirecting to Vipps.
- `providerSubscriptionId` stores the Vipps agreement id.
- `/abonnement/status` checks Vipps agreement status server-side after redirect.
- Verified webhook route at `POST /api/billing/webhooks/vipps`.
- Webhook raw body handling, content hash/signature check and idempotency table.
- Agreement status sync to provider-neutral `subscription` and `entitlement`.

Not implemented yet:

- Production Vipps environment.
- Customer portal/cancel flow.
- Operational retry handling for failed webhook processing.
- Final production QA with customer-owned Vipps account.

## Required Env Vars

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

Use a public tunnel such as ngrok or Cloudflare Tunnel for local webhook testing. Do not commit `.env` or real credentials.

## Endpoints

- `POST /api/billing/checkout`
  - Requires Better Auth session.
  - Creates a pending provider-neutral subscription.
  - Creates a Vipps agreement.
  - Returns `checkoutUrl` / `vippsConfirmationUrl`.

- `POST /api/billing/subscription/status`
  - Requires Better Auth session.
  - Finds the current user's own subscription server-side.
  - Fetches Vipps agreement status.
  - Updates subscription/entitlement only from verified Vipps status.

- `POST /api/billing/webhooks/vipps`
  - Reads raw request body.
  - Verifies `x-ms-content-sha256` and authorization signature.
  - Records the webhook event in `billing_event`.
  - Fetches Vipps agreement status before mutating subscription/entitlement.

## Status Mapping

- Vipps `ACTIVE` or `ACCEPTED` -> `subscription.status=active`
- Vipps `PENDING` or `CREATED` -> no premium access yet
- Vipps `STOPPED`, `CANCELLED` or `CANCELED` -> `subscription.status=cancelled`
- Vipps `EXPIRED` -> `subscription.status=expired`
- Vipps `FAILED` or `REJECTED` -> `subscription.status=past_due`

Client redirects never grant premium access by themselves.
