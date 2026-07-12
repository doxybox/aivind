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
8. Create or update a frontpage slot and confirm `/` shows the selected article.
9. Remove optional image/author/category from a safe test article and confirm frontend does not crash.

Acceptance criteria:

- Published public article is visible.
- Draft and future-published articles are not visible.
- Members and premium access are checked server-side.
- Premium body is not serialized without entitlement.
- Frontpage slot controls the top/hero placement.
- Missing image/author/category does not crash the frontend.

## Editorial QA Run Sheet

Use this checklist with real editorial records. Seeded `[DEMO]` records do not count toward production approval.

Payload Admin setup:

- [ ] Create the real AI category and confirm its public route is `/ai`.
- [ ] Create the real Gaming category and confirm its public route is `/gaming`.
- [ ] Create at least one additional category.
- [ ] Create real named authors with appropriate biography and profile data.
- [ ] Upload or select owned media when the media provider is enabled; otherwise verify the local fallback image.
- [ ] Create and publish one public article.
- [ ] Create and publish one members article.
- [ ] Create and publish one premium article.
- [ ] Create one draft article.
- [ ] Create one future/scheduled article if scheduling is supported in the staging workflow.
- [ ] Create or update active frontpage slots, including the hero placement.
- [ ] Verify SEO title, description, canonical slug and social image for each approval article.

Public staging:

- [ ] `/` displays the intended hero and frontpage slots.
- [ ] `/ai` contains only the expected AI articles.
- [ ] `/gaming` contains only the expected Gaming articles.
- [ ] `/artikler/<public-slug>` displays the full public body.
- [ ] `/artikler/<members-slug>` hides the body while logged out and opens after login.
- [ ] `/artikler/<premium-slug>` hides the body without entitlement and opens for an entitled or staff user.
- [ ] Draft, future and unknown article slugs return 404.
- [ ] Members and premium bodies are absent from logged-out HTML/source.
- [ ] Frontpage slot changes appear in the expected existing layout.
- [ ] All images load from owned media or local fallback paths.
- [ ] Browser console has no resource, hydration or application errors.

Account and auth:

- [ ] Register a staging reader account.
- [ ] Log in, log out and return to the expected route.
- [ ] `/min-side` is blocked while logged out and shows the user's real data while logged in.
- [ ] Saving and removing an article persists correctly.
- [ ] Newsletter preferences load and persist correctly.
- [ ] Password reset works only when the staging email provider is configured.
- [ ] Email verification works only when the staging email provider is configured.

Staff and admin:

- [ ] Payload Admin login succeeds for a named admin/editor account.
- [ ] The editor can create, edit and publish an article.
- [ ] The editor can update a frontpage slot.
- [ ] A staff user can open `/redaksjon/media` when media is enabled.
- [ ] A regular user receives 403 or an equivalent blocked state for `/redaksjon/media`.
- [ ] A logged-out user is redirected or receives 401 for `/redaksjon/media`.

Image policy for staging:

- Local placeholders under `/images/placeholders/` are the safe fallback when an article has no owned media.
- Production-critical UI must not depend on Clearbit, Unsplash, Pravatar or Base44-hosted images.
- Existing native `<img>` lint recommendations are accepted for staging. Migrating selected hero and article surfaces to `next/image` is a separate visual-performance task.
- Review every remote domain before adding it to a future `next/image` configuration.

## Staging Browser QA Routes

Test:

- `/`
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
3. Smoke-test `/ai`.
5. Smoke-test one known legacy article route.
6. Confirm Payload Admin can remain online; rollback only affects public content source.

Do not delete Payload content during rollback.

Rollback verification:

- [ ] Set staging `CONTENT_SOURCE=legacy` without changing production.
- [ ] Redeploy the public staging project.
- [ ] Verify `/`, `/ai`, one legacy article, `/login` and `/min-side`.
- [ ] Set staging back to `CONTENT_SOURCE=payload` and redeploy after the rollback exercise.

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
