# Production Cutover Checklist

This is the operational checklist for moving TEKKNO from the current production default to Payload-backed public rendering later. It does not make `CONTENT_SOURCE=payload` the production default.

Use together with:

- `docs/production-blockers.md` (canonical go/no-go tracker)
- `docs/staging-checklist.md` (final staging execution sheet)
- `docs/production-readiness.md`
- `docs/payload-staging-readiness.md`
- `docs/payload-editorial-staging-qa.md`
- `docs/payload-public-rendering.md`

## Cutover Rule

Current decision: **NO-GO**. PB-01 through PB-06 in `docs/production-blockers.md` must be complete before production-default can be approved.

Current staging baseline:

- Public: `https://staging.tekkno.no`
- Payload Admin: `https://admin-staging.tekkno.no/admin`
- Staging content source: `payload`
- Automated verifier and anonymous smoke: green
- Editorial data: demo-only for approval purposes; no future-published test record

Do not start production cutover until these are true:

- Staging has run `CONTENT_SOURCE=payload` with real editorial content.
- Payload Admin has a stable staging/production URL and access model.
- Editorial workflow QA is signed off.
- Database backup and migration ownership are agreed.
- Rollback to `CONTENT_SOURCE=legacy` is documented and smoke-tested.
- Vipps and Cloudflare launch status is explicitly decided as either parked or active.

Production default remains:

```env
CONTENT_SOURCE=legacy
```

until a separate go/no-go decision changes it.

## Environment Matrix

Do not put secrets in this document. Values below are shape and intent only.

| Variable | Local dev | Staging | Production |
| --- | --- | --- | --- |
| `CONTENT_SOURCE` | `legacy` by default, `payload` for local QA | `payload` for editorial QA | `legacy` until production go/no-go |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://<staging-public-origin>` | `https://<production-public-origin>` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `http://localhost:3000` | `https://<staging-public-origin>` | `https://<production-public-origin>` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://<staging-public-origin>` | `https://<production-public-origin>` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Local app/admin ports | Staging public + staging admin origins | Production public + production admin origins |
| `PAYLOAD_PUBLIC_SERVER_URL` | Local public/admin origin used by Payload | `https://<staging-admin-origin>` or agreed public Payload URL | `https://<production-admin-origin>` or agreed public Payload URL |
| `DATABASE_URI` / `DATABASE_URL` | Local/dev Supabase Postgres | Staging Supabase Postgres | Production Supabase Postgres |
| `PAYLOAD_DATABASE_URL` | Usually same Postgres, if required | Staging Payload DB connection | Production Payload DB connection |
| `PAYLOAD_SECRET` | Local secret | Staging secret | Production secret |
| `BETTER_AUTH_SECRET` | Local secret | Staging secret | Production secret |
| `CLOUDFLARE_MEDIA_ENABLED` | `false` unless explicitly testing | `false` while parked | `false` unless customer activates runtime |
| `BILLING_PROVIDER` | Empty while parked | Empty while parked | Empty while parked, or signed-off provider |
| `ALLOW_BASE44_API_REWRITE` | `false`; only `true` for intentional legacy proxy tests | `false` | `false` |
| `ALLOW_TEST_ENTITLEMENT_GRANT` | Optional local-only | `false` unless controlled staging QA | `false` |
| `ALLOW_TEST_BILLING_CHECKOUT` | Optional local-only | `false` | `false` |

### Staging Env Preflight

Before editorial staging QA:

- `CONTENT_SOURCE=payload`.
- `CLOUDFLARE_MEDIA_ENABLED=false` if Cloudflare is parked.
- `BILLING_PROVIDER=` if Vipps/payment is parked.
- Auth/site URLs point to staging, not localhost.
- Trusted origins include both staging public site and staging admin origin.
- Payload server URL points to the stable staging admin/public Payload origin.
- No production secrets are used in local/dev env files.

### Production Env Preflight

Before production cutover:

- Production env has been reviewed by two people without exposing secret values in chat/docs.
- `CONTENT_SOURCE` is changed only during the approved cutover window.
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, and `NEXT_PUBLIC_SITE_URL` point to production public origin.
- `BETTER_AUTH_TRUSTED_ORIGINS` includes production public and admin origins only.
- `PAYLOAD_PUBLIC_SERVER_URL` points to the stable production Payload origin.
- `ALLOW_BASE44_API_REWRITE=false`.
- Parked services are explicitly disabled.

## Payload Admin URL

Preferred production model:

```txt
https://admin.<production-domain>/admin
```

Rules:

- Keep public Pages Router app and Payload Admin app separate.
- Only approved admins/editors/journalists and technical maintainers get access.
- Payload Admin users are managed through Payload `payload-users`.
- Better Auth remains the public-site auth system.
- Do not allow self-assignment of admin/editor/journalist roles.

Before production:

- Confirm admin URL resolves over HTTPS.
- Confirm Payload Admin login works.
- Confirm collections open: `articles`, `categories`, `authors`, `frontpage-slots`, `media-assets`.
- Confirm editors know how to log in and who owns account recovery.

## Backup And Migration Runbook

### Before Migrations

1. Announce migration window.
2. Confirm current deploy version and target deploy version.
3. Confirm the Supabase managed backup/PITR state and take an encrypted logical app-relations dump when required by the release plan.
4. Record backup timestamp and restore owner.
5. Confirm `.env`/deployment env points to the intended database.
6. Confirm no destructive migration is planned without rollback approval.

### Running Drizzle Migrations

Operator: agreed technical maintainer only.

Command:

```bash
npm run db:migrate
```

Rules:

- Run against staging first.
- Verify migration output and app health before production.
- Do not run from a machine with mixed or unknown env values.
- Do not hardcode credentials in commands, scripts, docs, or chat.

Restore process evidence: the non-production restore test passed on 13 July 2026 using a separate Supabase project. The restored copy matched 39 app tables, 71 constraints, 162 indexes and all row counts, and passed `npm run payload:verify-public-rendering:strict`. Eivind Von Døhlen owns backup, restore, migrations and deploy. Test dumps are deleted immediately; an encrypted cutover dump is retained for 7 days after successful launch and then deleted.

### Running Payload Migrations

Command when Payload schema changes:

```bash
npm run payload:migrate
```

Rules:

- Keep Payload collection changes separate from public frontend cutover unless the change is required.
- Confirm Payload Admin can open key collections after migration.
- Confirm public Payload verifier still passes.

### Verifying Migrations

After migrations:

- Run the application build/checks listed in this document.
- Confirm Better Auth tables still support login/session.
- Confirm app tables exist for profile, role, subscription, entitlement, saved articles, newsletter preferences, billing events.
- Confirm Payload collections open in admin.
- Confirm public rendering can query published articles/categories/authors/frontpage slots.

### If Deploy Or Migration Fails

- Stop further migrations.
- Keep current production env on `CONTENT_SOURCE=legacy` unless the approved rollback says otherwise.
- Restore from backup only if schema/data corruption is confirmed and a restore owner approves.
- Re-run smoke tests after rollback or restore.
- Write a short incident note: time, change, symptom, rollback action, owner, next step.

## Production Smoke Test

Run immediately after deploy and again after changing `CONTENT_SOURCE`.

Public routes:

- `/`
- `/ai`
- `/artikler/<public-article-slug>`
- `/artikler/<members-article-slug>`
- `/artikler/<premium-article-slug>`
- `/artikler/<unknown-slug>`
- `/artikler/<draft-slug>` if available
- `/artikler/<future-slug>` if available

Account/auth routes:

- `/login`
- `/register`
- `/min-side`
- `/abonnement`

Admin:

- Payload Admin `/admin`
- `articles`
- `categories`
- `authors`
- `frontpage-slots`
- `media-assets`

Acceptance:

- No Next error overlay.
- No hydration errors.
- No obvious layout breaks.
- Public article body is visible.
- Members article requires login.
- Premium article hides full body without entitlement.
- Premium-only body is not present in HTML/source without entitlement.
- Draft/future/unknown slug returns 404.
- `/min-side` requires login and shows real account data.
- `/abonnement` truthfully shows billing parked/disabled if payment is not active.
- Cloudflare/media upload is disabled if `CLOUDFLARE_MEDIA_ENABLED=false`.

## Editorial QA Before Production Default

Production default cannot switch to Payload until Payload contains real editorial content:

- At least 3 real published articles.
- At least 1 public article.
- At least 1 members article.
- At least 1 premium article.
- At least 1 active AI category with `slug=ai`.
- At least 1 additional active category.
- At least 1 active author.
- At least 1 active frontpage slot / hero placement.
- At least 1 draft article for leakage testing.
- At least 1 future-published article for leakage testing.
- No `[DEMO]` titles are used for production approval.

Editorial workflow must be tested:

- Create article.
- Edit article.
- Set slug.
- Set category.
- Set author.
- Set access level: public, members, premium.
- Publish.
- Save draft.
- Set future publish date.
- Create/update frontpage slot.
- Confirm changes appear on frontend.

## Parked Service Launch Status

Set one launch decision for each service before production cutover.

| Service | Default launch status | Required if active |
| --- | --- | --- |
| Vipps/payment | Parked | Signed-off provider runtime QA, webhook/status verification, support runbook |
| Cloudflare Images/Stream | Parked | Customer-owned quota/credentials, upload QA, cost/abuse controls |
| Avatar upload | Parked | Real upload provider, persistence, validation, deletion policy |
| 2FA | Parked | Better Auth/backend implementation and recovery flow |
| Payment history | Parked if billing parked | Real provider event/history source |
| Media upload | Disabled if Cloudflare parked | Staff-only access, rate limits, Cloudflare QA |
| Reels/video upload | Parked with Cloudflare | Working media provider and editorial moderation workflow |

UI rule:

- Parked services must not look active.
- Buttons may open explanatory disabled states, but must not pretend payment, upload, 2FA, or provider history succeeded.

## Rollback To Legacy

Rollback switch:

```env
CONTENT_SOURCE=legacy
```

Rollback process:

1. Change production env in the hosting/deployment platform.
2. Redeploy or restart the public app.
3. Smoke-test `/`, `/ai`, one article route, `/login`, `/min-side`, `/abonnement`.
   Also check retired `/nyfrontside1`; it should remain 404 unless an explicit redirect is approved.
4. Keep Payload Admin online unless it is the failure source.
5. Do not delete Payload content during rollback.
6. Record rollback time, owner, and reason.

Rollback does not roll back database migrations automatically. Use database restore only for confirmed migration/data corruption.

## Base44 And Ghost Cleanup After Launch

Do not remove these during cutover:

- `@base44/sdk`
- `src/api/base44Client.js`
- `/api/apps/[appId]/*` compatibility shims
- disabled Base44 rewrite config
- historical `media.base44.com` references in architecture and cleanup documentation
- Ghost references in old migrations/history docs

Post-launch cleanup order:

1. Monitor production logs for `/api/apps/*` callers.
2. Confirm no active imports of `src/api/base44Client.js`.
3. Remove compatibility shims after logs prove no callers remain.
4. Remove `@base44/sdk`.
5. Archive or update old Base44/Ghost docs.
6. Run `npm run test:auth`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run payload-admin:build`.

## Required Checks Before Cutover Sign-Off

Run locally or in CI before production default is changed:

```bash
CONTENT_SOURCE=payload npm run payload:verify-public-rendering
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run payload-admin:build
CONTENT_SOURCE=legacy npm run build
```

Expected:

- All commands pass.
- Payload verifier has no warnings/errors.
- `CONTENT_SOURCE=legacy` build remains green.
- Payload Admin build may still show known non-blocking warnings about lockfile layout or ESLint plugin until separate dependency cleanup is done.

## Go / No-Go Template

```txt
Date:
Release owner: Eivind Von Døhlen
Database backup timestamp:
Migration owner: Eivind Von Døhlen
Public production URL:
Payload Admin URL:

Env reviewed:
- CONTENT_SOURCE:
- Better Auth URLs:
- Trusted origins:
- Payload URL:
- Billing status:
- Cloudflare status:

Editorial QA:
- Real content present:
- No [DEMO] approval content:
- Workflow signed off:
- Paywall signed off:

Smoke test:
- /:
- /ai:
- public article:
- members article:
- premium article:
- draft/future/unknown:
- /login:
- /register:
- /min-side:
- /abonnement:
- Payload Admin:

Rollback:
- Legacy rollback owner: Eivind Von Døhlen
- Rollback tested:
- Restore owner: Eivind Von Døhlen

Decision:
- Go:
- No-go reason:
- Follow-up:
```
