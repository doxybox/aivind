# Payload Subscription Catalog

Payload Admin owns the public subscription catalog for new customers. This includes prices, descriptions, feature lists, CTA text, order, popularity and whether a plan is visible.

It does not replace Better Auth or the application database:

- Better Auth owns identity, sessions and passwords.
- Drizzle/Supabase owns real subscription rows, billing events and entitlements.
- Payload owns the editable offer shown to a prospective customer.

## Safe Contract

When checkout starts, the server resolves the selected plan from Payload and stores a snapshot in the `subscription` row. An existing subscription therefore keeps its original price, interval and entitlement even if an editor later edits the Payload plan.

`planKey` and `interval` are stable integration identifiers. Do not change them after a plan exists; create a new plan instead. `entitlementKey` and `checkoutMode` affect only future confirmed subscriptions and must be changed deliberately.

## First Setup

1. Run `npm run payload:migrate` against the intended database.
2. Run `npm run payload:seed-subscription-plans` once to create the initial plans.
3. In Payload Admin, open **Innstillinger -> Subscription Plans**.
4. Edit visible prices, descriptions and benefits as needed.
5. Keep `checkoutMode` as **Ikke tilgjengelig** while billing is parked.

The customer portal and `/abonnement` read the same catalog through a read-only internal API. If Payload is unavailable or no plans are active, the UI fails closed and does not offer checkout.

## Enabling A Plan Later

Do not enable checkout from Payload alone. First complete provider, webhook and entitlement QA. Then verify that the relevant plan has:

- an active price and currency,
- a stable `planKey`,
- the intended entitlement key,
- required provider product mapping,
- `checkoutMode=checkout`.

The payment provider still decides payment success. Payload is never allowed to grant access by itself.
