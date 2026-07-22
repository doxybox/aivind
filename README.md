# TEKKNO

TEKKNO is a Norwegian technology news platform built with Next.js Pages Router. Public content is
managed in Payload CMS, user sessions use Better Auth, and application data is stored in Supabase
Postgres through Drizzle.

## Stack

- Next.js Pages Router and JavaScript/JSX
- Better Auth for users and sessions
- Supabase Postgres and Drizzle for private application data
- Payload CMS for articles, categories, authors, media, frontpage slots and editorial workflows
- Stripe Billing provider support for subscriptions (disabled until configured)
- Cloudflare media integration (enabled only when explicitly configured)

## Local setup

1. Copy `.env.example` to `.env` and fill in the required database, Better Auth and Payload values.
2. Install dependencies with `npm install`.
3. Apply the approved database migrations with `npm run db:migrate`.
4. Run the public app with `npm run dev`.
5. Run Payload Admin separately with `npm run payload-admin:dev` when editorial access is needed.

Never commit `.env`, `.env.local`, Stripe secrets or database credentials.

## Common checks

```bash
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run payload-admin:build
```

## Billing

Billing is disabled unless `BILLING_PROVIDER=stripe` and the required Stripe configuration is set.
Stripe Checkout and Customer Portal keep card details, invoices, receipts, refunds and cancellations in
Stripe. Subscription access changes only after verified Stripe webhooks. Read
[docs/stripe-billing.md](docs/stripe-billing.md) before enabling it.

## Content source and rollback

`CONTENT_SOURCE=legacy` remains the safe fallback. Payload public rendering can be enabled by setting
`CONTENT_SOURCE=payload`. See the production cutover and staging runbooks in `docs/` before changing
the production setting.
