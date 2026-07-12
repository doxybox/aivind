# Launch Operations

This runbook covers the operational work that remains before TEKKNO can be treated as production-ready. It does not enable billing, Cloudflare Stream, or Payload as the production content default.

## Current Safe State

- Public frontend, Better Auth, Drizzle/Supabase, Payload Admin and server-side paywall checks build and pass automated checks.
- `CONTENT_SOURCE=legacy` remains the production rollback/default until editorial sign-off.
- Vipps must remain disabled while provider runtime and webhook verification are unsigned.
- Cloudflare media must remain disabled unless customer-owned quotas, tokens and end-to-end uploads are verified.
- Rate limiting is shared through Postgres after migration `0009_chief_dark_beast.sql`.
- Reel analytics uses a server-side HMAC pseudonym and does not set a dedicated viewer cookie.
- `/api/health` checks database readiness without returning secrets.
- The public staging Vercel project uses `CONTENT_SOURCE=payload`; rollback remains `CONTENT_SOURCE=legacy`.
- Payload uses `PAYLOAD_DATABASE_URL` ahead of the general app connection. Serverless staging/production must use the Supabase transaction pooler and `PAYLOAD_DATABASE_POOL_MAX=1` to avoid exhausting session connections.

## P0 Manual Actions

These actions cannot be completed safely from source code alone:

1. Rotate every database, Cloudflare, Vipps, auth and Payload credential that has ever been pasted into chat, logs or screenshots. Revoke old values and update Vercel through its encrypted environment settings.
2. Enable Resend only after `tekkno.no` is verified and a production sender is approved. Set `RESEND_API_KEY`, `EMAIL_FROM` and optionally `EMAIL_REPLY_TO`, then test verification and password reset end to end.
3. Keep named owners for Supabase backup/restore, migrations, Vercel incidents, Payload Admin access and security response current in the release record.
4. Create real editorial content and complete editorial staging QA. Demo content cannot approve production.
   Run `npm run payload:audit-editorial-content:strict` against the target environment to verify the database minimum without printing article content.
5. Decide explicitly whether Vipps and Cloudflare are parked or active at launch. An active decision requires provider-specific runtime QA.

Current editorial inventory on 13 July 2026: four published demo articles (two public, one members, one paid), two categories, one author, one active frontpage slot and one draft. A future-scheduled test article and all non-demo launch content are still missing.

## Required Production Secrets

Never reuse the same random value for different purposes.

- `BETTER_AUTH_SECRET`: Better Auth signing secret.
- `PAYLOAD_SECRET`: Payload secret.
- `REEL_ANALYTICS_SECRET`: HMAC secret for pseudonymous reel actors.
- `CRON_SECRET`: protects the Vercel maintenance endpoint.
- `DATABASE_URI` or `DATABASE_URL`: pooled production Postgres connection.
- `RESEND_API_KEY`: required only when production email is enabled.
- Provider tokens for Vipps/Cloudflare only when those services are approved and enabled.

Generate server secrets with a cryptographically secure generator, store them only in the deployment secret store, and rotate them according to the incident policy.

## Database Migration And Restore

Owner for backup, restore, migrations and deploy: Eivind Von Døhlen.

The non-production restore test passed on 13 July 2026. A PostgreSQL 18 logical dump copied only the `public` and `drizzle` app relations into a separate, empty Supabase project. Validation matched 39/39 tables, 71/71 constraints, 162/162 indexes and every table row count; the strict Payload public-rendering verifier also passed against the restored database. Supabase-managed backups/PITR remain the primary operational backup where supported. Restore-test dumps must be deleted immediately, while an encrypted pre-cutover logical dump may be retained for 7 days after a successful launch.

1. Confirm the target database and current deployment SHA.
2. Take or verify a restorable Supabase backup before migration.
3. Record backup timestamp, target migration and operator in the release ticket.
4. Run `npm run db:migrate` from a controlled CI job or operator machine.
5. Verify the Drizzle migration journal and that `rate_limit_bucket` exists.
   Run `npm run db:verify-rate-limit` against the target environment; it creates and removes one random probe row.
6. Run `npm run test:auth`, build checks, `/api/health`, login and account smoke tests.
7. If migration or deploy fails, roll back application deployment first. Restore the database only when the reviewed migration cannot coexist with the previous app version.

Migration `0009_chief_dark_beast.sql` is additive and can coexist with the previous application version.

## Retention Job

Vercel calls `/api/internal/maintenance/analytics` daily using `CRON_SECRET`.

- Reel view rows older than `REEL_VIEW_RETENTION_DAYS` are deleted. Default: 395 days.
- Expired rate-limit buckets older than one day are deleted.
- A `401` means `CRON_SECRET` is absent or mismatched.
- A `500` should alert the technical owner; logs intentionally contain no token or row content.

## Monitoring

Create alerts before launch for:

- Vercel function 5xx rate and latency, especially auth, account, health, newsletter and article APIs.
- `/api/health` returning non-200.
- Supabase connection saturation, storage growth, backup failures and slow queries.
- Better Auth invalid-origin spikes and transactional email failures.
- Payload Admin deployment failures and public rendering fallback/error rates.
- Cron failures for analytics retention.
- Vipps/Cloudflare errors only if those services are enabled.

Logs must not contain credentials, access tokens, reset links, raw private request bodies or complete provider payloads.

## Smoke Test

Run the non-mutating public check after each deployment:

```bash
SMOKE_BASE_URL=https://tekkno.no npm run smoke:production
```

Then manually verify login, email verification, password reset, `/min-side`, a public article, a members article, a premium article with and without entitlement, Payload Admin and the parked state of billing/media.

## Content Cutover And Rollback

Cutover requires real content, stable Payload Admin, editorial sign-off, backup confirmation and a named incident owner.

Rollback public content without a database change:

1. Set `CONTENT_SOURCE=legacy` in the public Vercel project.
2. Redeploy the last known-good commit.
3. Smoke-test `/`, `/ai`, one legacy article, `/login`, `/min-side` and `/abonnement`.
4. Keep Payload Admin and the database available for diagnosis.

Do not delete Payload data or run reverse migrations as part of content-source rollback.
