# Production Readiness

This document tracks low-risk production readiness for the current TEKKNO news platform architecture.

For the cutover-day checklist, env matrix, backup/migration runbook and smoke-test template, see `docs/production-cutover-checklist.md`.

## Current Architecture

- Next.js Pages Router serves the public frontend and account pages.
- Better Auth is the only auth/session source.
- Supabase is used as Postgres only. Supabase Auth is not used.
- Drizzle owns app data such as profiles, roles, subscriptions, entitlements, saved articles, newsletter preferences, and billing events.
- Payload CMS owns editorial content, media metadata, frontpage slots, reels, tips, and ads.
- `CONTENT_SOURCE=legacy` remains the production default until editorial staging QA is complete.
- `CONTENT_SOURCE=payload` is approved for staging-default on code, verifier, and browser-QA level, but not production-default.

## Green

- Better Auth login/register/session is integrated with Pages Router API routes.
- Account overview, profile, subscription read layer, saved articles, newsletter preferences, and tips are backed by real server-side APIs.
- Paywall/entitlement checks are server-side and do not trust client-supplied `userId`.
- Payload public rendering is verified for `/`, `/ai`, and article routes behind `CONTENT_SOURCE=payload`.
- Public, members, premium, draft, future-published, and unknown Payload article cases are covered by verifier/tests.
- Premium body content is not serialized to unauthorized users.
- `CONTENT_SOURCE=legacy` rollback build has been verified.
- Security headers, API method checks, auth checks, and safe error responses are in place for the hardened routes reviewed so far.
- API rate limiting uses shared Postgres state after migration `0009_chief_dark_beast.sql`; it is no longer process-local.
- Database readiness is exposed through the secret-free `/api/health` endpoint.
- Reel analytics is pseudonymous, has no dedicated viewer cookie, and is covered by a daily retention job.

## Parked

- Vipps/payment runtime is parked. Billing UI must show disabled/parked state unless `BILLING_PROVIDER` and provider credentials are explicitly configured.
- Cloudflare Images/Stream runtime is parked. Upload UI/API must remain disabled unless `CLOUDFLARE_MEDIA_ENABLED=true` and customer-owned quotas/credentials are active.
- 2FA is parked until implemented through Better Auth/backend.
- Avatar upload is parked until a real media persistence flow is selected.
- Reels/video can exist in Payload, but Cloudflare-backed runtime upload is not production-ready.
- Ghost is deprecated/inactive and must not be reintroduced without a new architecture decision.
- Base44 is legacy/isolated and must not be used for auth, private account data, subscription, entitlement, payment, newsletter, saved articles, or CMS source-of-truth.

## Production Blockers

- Real editorial content is still required in Payload. The current Payload records are demo seed content and must not count for production approval; a future-published workflow record is also missing.
- A stable Payload Admin URL/origin must be available for the editorial team.
- Editorial workflow QA must pass with real content: create, edit, draft, publish, future-publish, category, author, and frontpage-slot changes.
- Production env values must be reviewed without exposing secrets.
- Backups and migration runbooks must be agreed before production cutover.
- Billing must either remain visibly parked or pass signed-off provider runtime QA.
- Cloudflare media must either remain visibly parked or pass signed-off customer quota/runtime QA.
- Monitoring/logging ownership must be clear for auth, payments, CMS, database, and public rendering errors.
- Credentials previously exposed through chat, screenshots, terminals or logs must be revoked and replaced before launch.
- Production email requires a verified sender plus end-to-end verification/reset testing.

## Required Env

Production/staging env should include these groups as applicable:

- Content source: `CONTENT_SOURCE`.
- Site/auth URLs: `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`.
- Auth secret: `BETTER_AUTH_SECRET`.
- Database: `DATABASE_URI` or `DATABASE_URL`, optional `DATABASE_POOL_MAX`.
- Payload: `PAYLOAD_SECRET`, `PAYLOAD_DATABASE_URL` if different from app DB, `PAYLOAD_PUBLIC_SERVER_URL`.
- Payload connection pool: `PAYLOAD_DATABASE_POOL_MAX` (recommended staging/production value: `3`).
- Supabase Postgres metadata/client compatibility: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; service keys only where server-side code explicitly requires them.
- Email/social only if enabled: `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`.
- Operations/analytics: `REEL_ANALYTICS_SECRET`, `CRON_SECRET`, optional `REEL_VIEW_RETENTION_DAYS` and `EMAIL_REPLY_TO`.
- Billing only if active: `BILLING_PROVIDER`, `BILLING_PUBLIC_ORIGIN`, provider-specific env such as Vipps credentials.
- Cloudflare only if active: `CLOUDFLARE_MEDIA_ENABLED=true`, account id, image/stream tokens, image account hash, webhook secret.

Never commit `.env` or real credentials.

## Rollback

Payload public rendering rollback is controlled by:

```env
CONTENT_SOURCE=legacy
```

Rollback steps:

1. Change the environment variable in the deployment platform.
2. Restart/redeploy the public app.
3. Smoke-test `/`, `/ai`, at least one article route, `/min-side`, and `/abonnement`.
4. Confirm Payload Admin remains available separately if editors still need CMS access.

Do not remove legacy fallback until production has run safely on Payload and a separate cleanup decision is made.

## Repo And Build Hygiene

- Root package name has been changed from `base44-app` to `aivind-tech-pulse`.
- The multiple lockfiles warning is caused by a parent `E:\Nettsider\package-lock.json` plus the intentionally separate `payload-admin/package-lock.json`. Do not delete either during production work without a separate dependency-layout cleanup.
- Payload Admin build currently warns that the Next.js ESLint plugin is not detected. Existing lint/build checks pass; adding `eslint-config-next` or a separate admin ESLint config should be handled as a focused cleanup, not during release cutover.
- `.env.example` should mirror current env usage and keep parked services disabled by default.

## Legacy Audit

Known legacy remnants:

- `@base44/sdk` remains in dependencies for staged cleanup.
- `src/api/base44Client.js` remains as an isolated legacy wrapper/fallback and should not be imported by active flows.
- `/api/apps/[appId]/*` compatibility shims remain to avoid old runtime calls becoming noisy 404s. They must not grant auth, subscription, entitlement, payment, or private data access.
- `next.config.js` still contains a Base44 rewrite path, disabled unless `ALLOW_BASE44_API_REWRITE=true` and not production.
- Active static image fallbacks are local owned assets. Historical docs may still mention `media.base44.com`, but public UI no longer loads it.
- Ghost references remain in old migrations/docs and compatibility history. Active Payload collections are `articles`, `categories`, `authors`, `media-assets`, `frontpage-slots`, `reels`, `tip-submissions`, and `ad-campaigns`.

Recommended cleanup order after production-critical QA:

1. Confirm no active imports of `src/api/base44Client.js`.
2. Remove `/api/apps/*` shims after runtime logs prove no callers remain.
3. Remove `@base44/sdk`.
4. Archive or rewrite old Base44/Ghost docs once architecture is stable.

## UI Truthfulness

- 2FA must remain disabled/not available until Better Auth-backed 2FA exists.
- Avatar upload must remain unavailable until a real upload/persistence flow exists.
- Payment history/customer portal/cancel subscription must not imply live provider support while billing is parked.
- Vipps copy must not imply checkout is live unless provider config is active.
- Cloudflare/media upload must remain disabled unless `CLOUDFLARE_MEDIA_ENABLED=true`.
- Reels/video should not require Cloudflare runtime while media is parked.

## Database Integrity

Current app DB safeguards:

- `user_profile.user_id` is unique.
- `user_role` is unique by `(user_id, role)` and indexed by `user_id`.
- `saved_article` is unique by `(user_id, article_slug)` and indexed for user/article lookup.
- `newsletter_preference.user_id` is unique.
- `billing_event` is unique by `(provider, event_id)` for webhook/idempotency handling.
- `subscription` and `entitlement` are indexed by user.

Recommended non-destructive DB hardening before full payment production:

- Add or enforce a provider-aware uniqueness rule for active external subscription ids after the final billing provider behavior is confirmed.
- Consider foreign keys from app tables to Better Auth users if operational delete/cascade behavior is agreed.
- Add subscription/entitlement consistency checks or periodic audit job for expired periods.
- Ensure migrations are applied through `npm run db:migrate` with pre-migration backup.

## Backups And Migrations

- Take a Supabase Postgres backup before running production migrations.
- Run Drizzle migrations with production env only from a controlled operator machine or CI job.
- Run Payload migrations separately when collections/schema change.
- Keep migration output and deployment logs for rollback/debugging.
- Never run destructive migrations without a reviewed rollback plan.

## Admin Users And Roles

- Admin/editor/journalist roles must be assigned server-side by trusted operators or seed/admin scripts.
- Users must never self-assign privileged roles.
- Payload Admin access should be restricted to approved editorial/admin users.
- Staff access must be tested for `/redaksjon/*` and media/admin APIs before launch.

## Monitoring And Logging

Minimum production monitoring should cover:

- Auth failures and invalid origins.
- API 401/403/5xx rates.
- Paywall access denials and entitlement decisions.
- Billing/webhook failures if billing is enabled.
- Payload public rendering fallback usage.
- Database migration failures.
- Cloudflare upload/webhook failures if media is enabled.

Logs must not include secrets, tokens, raw credentials, or full private payloads.

## Production Default Checklist

Before `CONTENT_SOURCE=payload` becomes production-default:

- Real non-demo Payload content exists and has editorial sign-off.
- Staging runs `CONTENT_SOURCE=payload` with real content and no Next error overlays/hydration errors.
- Payload Admin has stable URL/origin and editor login instructions.
- Draft/future/unknown slugs return 404.
- Members and premium access rules pass with real test users.
- Premium body leakage checks pass.
- `/min-side` and `/abonnement` truthfully reflect active/parked services.
- Legacy rollback to `CONTENT_SOURCE=legacy` is documented and smoke-tested.
- Backup, migration, monitoring, and incident ownership are agreed.
