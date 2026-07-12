# Payload Staging Readiness

This checklist prepares staging for `CONTENT_SOURCE=payload` with real editorial content. It does not make Payload the production default.

For the operational editorial QA runbook, see `docs/payload-editorial-staging-qa.md`.

## Scope

Do not use this pass to build payments, Vipps, Cloudflare runtime, new layouts, App Router migration, TypeScript migration, or remove legacy fallback.

The goal is to prove that staging can safely render public frontend content from Payload while keeping rollback simple:

```env
CONTENT_SOURCE=legacy
```

## Required Staging Environment

Set these server-side values on staging:

```env
CONTENT_SOURCE=payload

DATABASE_URI=
PAYLOAD_SECRET=
PAYLOAD_PUBLIC_SERVER_URL=https://<staging-payload-admin-or-public-admin-origin>

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://<staging-public-site>
NEXT_PUBLIC_BETTER_AUTH_URL=https://<staging-public-site>
BETTER_AUTH_TRUSTED_ORIGINS=https://<staging-public-site>,https://<staging-payload-admin-origin>
NEXT_PUBLIC_SITE_URL=https://<staging-public-site>
```

Payload uses Supabase as Postgres only. Do not use Supabase Auth.

Use the same Supabase Postgres project/branch that staging is meant to validate, and make sure Payload migrations have already run against that database.

Cloudflare media remains parked unless the customer explicitly activates it:

```env
CLOUDFLARE_MEDIA_ENABLED=false
```

If Cloudflare is not active, do not require Cloudflare image or stream assets for staging content. Articles must render with fallback images or existing safe placeholders.

Billing/Vipps remains parked unless explicitly activated:

```env
BILLING_PROVIDER=
VIPPS_ENV=
```

If billing is disabled, premium access must still be QA-able through a manual/test entitlement row or staff/admin access. Do not grant access from client state.

The public `/abonnement` page must show `Betaling er ikke aktivert i dette miljøet.` or equivalent parked billing copy, and plan CTA buttons must not start checkout while `BILLING_PROVIDER` is empty/disabled.

## Editorial Minimum Content

Create this in Payload Admin on staging using real editorial test content, not demo seed content:

- At least one active author.
- At least one active `ai` category with `slug=ai` and `existingRoute=/ai`.
- At least three published articles with `publishedAt` in the past.
- At least one public article.
- At least one members article.
- At least one premium/paid article.
- At least one active frontpage slot for hero/top story placement.
- Optional but useful: one draft article and one future-published article for leakage tests.

Content rules:

- Draft, review, scheduled and future-published articles must not appear publicly.
- Premium article body must not be visible without server-side entitlement/subscription/staff access.
- Missing media must fall back safely.
- Missing optional author/category/media should not crash the page.

## Staging Routes To QA

Public frontend:

- `/`
- `/nyfrontside1`
- `/ai`
- `/artikler/<public-article-slug>`
- `/artikler/<members-article-slug>`
- `/artikler/<premium-article-slug>`
- `/artikler/<unknown-slug>`
- `/artikler/<draft-slug>` if available
- `/artikler/<future-slug>` if available

Payload Admin:

- `https://<staging-payload-admin-origin>/admin`
- `Articles`
- `Categories`
- `Authors`
- `Frontpage Slots`

If staging is tested through local tunnels, the public frontend tunnel should point at port `3000` and Payload Admin must have its own admin origin/tunnel pointing at port `3005`. Do not assume `/admin` exists on the public frontend tunnel.

Chosen stable admin URL plan: deploy Payload Admin separately on its own staging admin origin, for example `https://admin.<staging-domain>/admin`.

Fallback admin URL options for short-lived QA:

- Use a dedicated tunnel to `localhost:3005` for short-lived staging QA.
- Keep Payload Admin internal-only if editorial access is limited to VPN/internal network.

Whichever option is used, include both the public site origin and the admin origin in auth/trusted-origin configuration where required. Do not merge the public Pages Router app and the Payload Admin app for this staging pass.

Acceptance criteria:

- Pages render without crash or hydration overlay.
- Layout remains usable and visually consistent with the existing frontend.
- Payload article/category/frontpage data is visible where expected.
- Legacy fallback appears only when Payload has no usable content.
- Unknown slugs return 404.
- Draft and future-published content does not leak.
- Premium body is not present in visible page text or serialized HTML without access.
- Test entitlement or staff/admin access reveals premium body.

## Paywall QA

Test these states on staging:

- Logged-out user opens public article: full public body is visible.
- Logged-out user opens members article: body is hidden and login/access CTA appears.
- Logged-out user opens premium article: body is hidden and subscription/access CTA appears.
- Logged-in reader without entitlement opens premium article: body remains hidden.
- Logged-in reader with manual/test `premium` entitlement opens premium article: full body is visible.
- Staff/admin user opens restricted article: full body is visible if staff access is intended.

Safety checks:

- View page source or fetched HTML for the restricted premium article without entitlement.
- Confirm the premium-only body text is not serialized.
- Confirm access is resolved server-side, not by client-only guards.

## Data And Fallback QA

Validate incomplete editorial data:

- Article with no media uses fallback image.
- Article with missing optional author does not crash.
- Article with missing optional category does not crash.
- Empty frontpage slot does not crash homepage.
- Empty AI category shows the empty Payload state rather than Base44/Ghost data.
- Frontpage still renders latest published articles if no active frontpage slots exist.

## Local Commands Before Staging Sign-Off

Run locally after any code/doc fixes:

```bash
CONTENT_SOURCE=payload npm run payload:verify-public-rendering
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run payload-admin:build
```

## Staging Sign-Off Template

Use this format after browser QA:

```txt
Staging URL:
Payload Admin URL:
CONTENT_SOURCE:

Editorial minimum content:
- authors:
- categories:
- public articles:
- members articles:
- premium articles:
- active frontpage slots:
- draft/future test content:

Routes tested:
- /:
- /nyfrontside1:
- /ai:
- public article:
- members article:
- premium article:
- unknown slug:
- draft/future slug:
- Payload Admin:

Paywall:
- logged-out public:
- logged-out members:
- logged-out premium:
- logged-in no entitlement:
- logged-in with entitlement/staff:
- premium body not serialized without access:

Fallbacks:
- missing image:
- missing author/category:
- empty frontpage slot:
- empty AI category:

Decision:
- Ready as staging default: yes/no
- Ready as production default: no
- Remaining before production default:
```

## Before Production Default

Do not make `CONTENT_SOURCE=payload` the production default until:

- Staging has real editorial content, not only demo seed content.
- Public content titles no longer use `[DEMO]` prefixes.
- Editors have verified Payload Admin workflow.
- Paywall leakage checks pass on staging.
- Unknown/draft/future slugs are verified on staging.
- Rollback to `CONTENT_SOURCE=legacy` has been tested.
- Operational ownership is clear for database migrations, admin users, backups and editorial publishing.
- Parked Vipps and Cloudflare decisions are either completed or explicitly not part of launch.
