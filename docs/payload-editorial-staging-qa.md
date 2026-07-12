# Payload Editorial Staging QA

This document prepares staging for real editorial QA with `CONTENT_SOURCE=payload`. It does not make Payload the production default.

## Scope

Do not use this pass to build Vipps, Cloudflare runtime, new frontend layouts, App Router migration, TypeScript migration, or remove legacy fallback.

Staging default:

```env
CONTENT_SOURCE=payload
CLOUDFLARE_MEDIA_ENABLED=false
BILLING_PROVIDER=
```

Production default remains unchanged until production readiness is explicitly approved.

## Permanent Staging Environment

Staging must use staging URLs, not localhost:

```env
BETTER_AUTH_URL=https://<staging-public-origin>
NEXT_PUBLIC_BETTER_AUTH_URL=https://<staging-public-origin>
NEXT_PUBLIC_SITE_URL=https://<staging-public-origin>
BETTER_AUTH_TRUSTED_ORIGINS=https://<staging-public-origin>,https://<staging-admin-origin>
PAYLOAD_PUBLIC_SERVER_URL=https://<staging-admin-origin>
```

Current local `.env` may keep localhost values for local development, but the deployed staging environment must not use localhost for these values.

## Payload Admin Access Plan

Chosen plan: separate Payload Admin staging deploy / admin origin.

Recommended URL pattern:

```txt
https://admin.<staging-domain>/admin
```

Access:

- Only editors, journalists, admins and technical maintainers should have Payload Admin access.
- Better Auth remains the public-site auth system. Payload Admin users are managed in the Payload `payload-users` collection.
- Do not enable self-assignment of admin/editor/journalist roles.

Admin user creation:

- First admin is created through Payload Admin create-first-user or a controlled DB/admin setup step.
- Additional admin/editor users are invited or created by an existing Payload admin.
- Use named accounts. Do not share one common editorial login.

Required env:

```env
PAYLOAD_SECRET=
PAYLOAD_PUBLIC_SERVER_URL=https://admin.<staging-domain>
BETTER_AUTH_TRUSTED_ORIGINS=https://<staging-public-origin>,https://admin.<staging-domain>
```

Login flow:

1. Editor opens `https://admin.<staging-domain>/admin`.
2. Editor signs in with their Payload Admin account.
3. Editor creates/edits articles, authors, categories and frontpage slots.
4. Public frontend reads published content from the same Payload/Supabase database.

Keep the public Pages Router app and Payload Admin app separate.

## Editorial Minimum Content

Before production-default can be considered, Payload staging must contain real editorial content:

- At least 3 real published articles.
- At least 1 public article.
- At least 1 members article.
- At least 1 premium article.
- At least 1 active AI category with `slug=ai` and `existingRoute=/ai`.
- At least 1 additional active category.
- At least 1 active author.
- At least 1 active frontpage slot / hero placement.
- At least 1 draft article for leakage testing.
- At least 1 future-published article for leakage testing.

No `[DEMO]` titles should be used for production approval.

Media:

- Cloudflare media is parked.
- Do not require Cloudflare Images/Stream for editorial staging QA.
- Articles without media must render with fallback image/placeholder.

## Editorial Workflow QA

Run this in Payload Admin:

1. Create a public article with title, slug, excerpt, body, category and author.
2. Publish it with `publishedAt` in the past.
3. Confirm it opens on `/artikler/<slug>`.
4. Create a members article and confirm logged-out users cannot read body.
5. Create a premium article and confirm users without entitlement cannot read body.
6. Create a draft article and confirm `/artikler/<draft-slug>` returns 404.
7. Create a future-published article and confirm `/artikler/<future-slug>` returns 404 before publish time.
8. Create or update a frontpage slot and confirm `/` and `/nyfrontside1` show the selected article.
9. Remove optional image/author/category from a safe test article and confirm frontend does not crash.

Acceptance criteria:

- Published public article is visible.
- Draft and future-published articles are not visible.
- Members and premium access are checked server-side.
- Premium body is not serialized without entitlement.
- Frontpage slot controls the top/hero placement.
- Missing image/author/category does not crash the frontend.

## Staging Browser QA Routes

Test:

- `/`
- `/nyfrontside1`
- `/ai`
- `/artikler/<public-real-slug>`
- `/artikler/<members-real-slug>`
- `/artikler/<premium-real-slug>`
- `/artikler/<draft-real-slug>`
- `/artikler/<future-real-slug>`
- `/artikler/<unknown-slug>`
- `/min-side`
- `/abonnement`

Expected:

- Payload data appears on public routes.
- Legacy fallback appears only when Payload has no usable data.
- Members requires login.
- Premium requires entitlement/subscription/staff access.
- Premium body does not leak in HTML/source without access.
- `/abonnement` shows disabled billing while billing is parked.
- Cloudflare/media workflows are disabled/parked while `CLOUDFLARE_MEDIA_ENABLED=false`.
- No hydration errors, Next error overlay, or broken images.

## Rollback

To roll staging back to legacy rendering:

```env
CONTENT_SOURCE=legacy
```

Where to change it:

- Staging hosting environment variables.
- Any staging secrets/env manager used by the deploy target.

After changing it:

1. Restart/redeploy the public staging app.
2. Smoke-test `/`.
3. Smoke-test `/nyfrontside1`.
4. Smoke-test `/ai`.
5. Smoke-test one known legacy article route.
6. Confirm Payload Admin can remain online; rollback only affects public content source.

Do not delete Payload content during rollback.

## Before Production Default

Production-default remains blocked until:

- Real editorial content exists in Payload staging.
- No public production-approval content uses `[DEMO]` titles.
- Editorial team has completed workflow QA.
- Stable Payload Admin URL is deployed and access-controlled.
- Rollback is documented and tested.
- Vipps is either activated with signed-off runtime QA or clearly parked.
- Cloudflare is either activated with signed-off runtime QA or clearly parked.
- Base44/Ghost cleanup plan is agreed.
- Staging has completed at least one full QA round with real content.
