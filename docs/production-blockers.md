# Production Blocker Tracker

Last updated: 15 July 2026

This document is the production go/no-go source of truth for TEKKNO. It records operational and editorial work only; it does not enable parked services or change runtime behavior.

## Current Staging Status

| Area | Status | Evidence |
| --- | --- | --- |
| Public staging | Green | `https://staging.tekkno.no` responds and public smoke checks pass |
| Payload Admin staging | Green | `https://admin-staging.tekkno.no/admin` responds |
| Content source | Green for staging | `CONTENT_SOURCE=payload`; strict Payload verifier passes |
| Public rendering | Green | Homepage, category, article, health, 404 and protected-route smoke checks pass |
| Security audit | Accepted for staging | No high or critical findings; moderate findings remain documented |
| Runtime logs | Green at last check | No new Vercel runtime errors after staging smoke |
| Editorial content | Not production-ready | Six active `[DEMO]` records; no future-published test article |
| Billing/Vipps | Parked | Must remain disabled unless a separate provider QA is approved |
| Email provider | Safely parked | Self-service registration and password reset are disabled until a verified sender is configured; existing users can still log in |
| Cloudflare Images/Stream | Out of scope for this tracker | No behavior or enablement change is made here |

Current Payload inventory:

- 4 published articles: 2 public, 1 members and 1 premium.
- 2 categories, 1 author, 1 active frontpage slot and 1 draft.
- 0 future-published articles.
- 6 `[DEMO]` records. Demo content cannot approve production.

## Production Blockers

| ID | Blocker | Severity | Owner | Status | Evidence | Required action | Verification step | Production blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PB-01 | Demo content is still active | P0 | Editorial lead (unassigned) | Open | Strict audit on 13 July 2026 reports 6 `[DEMO]` records and exits non-zero as intended | Replace demo categories, author, articles and frontpage slot with approved editorial content | Run `npm run payload:audit-editorial-content:strict`; manually review Payload Admin | Yes |
| PB-02 | Future-publish workflow is untested | P1 | Editor + QA owner (unassigned) | Open | Strict audit on 13 July 2026 reports 0 future-published articles | Create a scheduled test article and complete before/after publication checks | Before time: public route is 404. After time: article is public and appears only where curated | Yes |
| PB-03 | Supabase password was previously shared | P0 | Project/database owner | Done | Password rotated; public deploy `dpl_9ge4hjcazLsJs4iJxLL9yJ7yEJR1` and admin deploy `dpl_HerHxjxwLC8q3wNFhq6cFRoqbygE` are Ready | Completed 13 July 2026; keep the new credential only in approved secret stores | DB probe, strict Payload verifier, health, Better Auth session, Payload Admin, public smoke and Vercel error-log checks passed | Yes |
| PB-04 | Backup and restore process verification | P0 | Eivind Von Døhlen | Done | Non-production restore completed on 13 July 2026: 39/39 app tables, 71/71 constraints, 162/162 indexes and all row counts matched; strict Payload verifier passed against the restored database | Use the documented managed-backup plus reviewed logical-dump process for cutover | Record a fresh backup timestamp and Eivind Von Døhlen's approval in the release record | Yes |
| PB-05 | Logged-in role QA is incomplete | P0 | QA lead (unassigned) | Open | 127 automated auth/access tests passed on 13 July 2026; no QA login credentials are configured, so browser role QA remains unsigned | Provide controlled reader, subscriber/member, premium-entitlement and staff test accounts and run browser QA | Complete the role matrix below and attach evidence without passwords | Yes |
| PB-06 | Production domain and DNS cutover are not approved | P1 | Release owner + DNS owner (unassigned) | Open | Only staging URLs are approved | Approve production public/admin domains, DNS records, TTL window and certificate plan | Resolve both domains over HTTPS and complete production-origin auth checks | Yes |
| PB-07 | Moderate dependency findings remain | P2 | Dependency owner (unassigned) | In progress | Root: 8 moderate. Admin: 8 moderate, 1 low. No safe automatic fix | Track upstream fixes; do not use forced breaking upgrades during cutover | `npm audit` has no high/critical; accepted-risk sign-off references exact advisories | No |
| PB-08 | Raw `<img>` build warnings remain | P2 | Frontend owner (unassigned) | Open | Next build reports image optimization warnings | Accept for launch or schedule provider-aware `next/image` migration | Build passes and release owner records the warning as non-blocking | No |

## Required Manual Actions

- [x] Rotate the Supabase database password in the Supabase console.
- [x] Update `DATABASE_URI`, `DATABASE_URL` and `PAYLOAD_DATABASE_URL` where applicable in both Vercel projects.
- [x] Revoke the old database credential through password rotation.
- [x] Redeploy public staging and Payload Admin staging without cache.
- [x] Run database, Better Auth, Payload Admin and public-content smoke tests after rotation.
- [x] Assign backup, restore, migration and deploy owners by name.
- [x] Record the Supabase backup method and retention policy.
- [ ] Replace all active demo content with approved editorial content.
- [ ] Create and test one future-published article.
- [ ] Run and sign off logged-in role QA.
- [ ] Approve production public/admin domains and DNS cutover plan.

## User-Role QA Matrix

Use `Pass`, `Fail`, `Blocked` or `Not applicable`. Do not store passwords or session cookies in evidence.

| User state | Homepage | Category page | Public article | Members article | Premium article | `/min-side` | Saved articles | Newsletter preferences | `/redaksjon/media` | Payload Admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Logged out | Open | Open | Open | Login CTA; no body leak | Login/subscribe CTA; no body leak | Redirect to login | 401 / login required | 401 / login required | Redirect/401 | Login page only |
| Reader | Open | Open | Open | Open after login | Denied; no body leak | Own account only | Own records only | Own preferences only | 403 | Denied |
| Subscriber/member | Open | Open | Open | Open | Denied unless premium entitlement exists | Own account/subscription | Own records only | Own preferences only | 403 | Denied |
| Premium entitlement user | Open | Open | Open | Open | Full body visible | Own account and active entitlement | Own records only | Own preferences only | 403 unless staff | Denied unless Payload staff account |
| Journalist/editor/admin | Open | Open | Open | Open | Open if staff policy grants access | Own account | Own records | Own preferences | Allowed for approved staff roles | Allowed according to Payload role |

QA evidence to record for every row:

- Tester and date.
- Test account role, never credentials.
- Routes/slugs used.
- Expected versus actual result.
- Screenshot or request ID for failures.
- Confirmation that restricted article body was absent from HTML/source.

## Content QA Checklist

- [ ] Categories use real names, descriptions, slugs and routes.
- [ ] Authors are real and approved for publication.
- [ ] Published articles are real editorial content.
- [ ] No active title, category, author or slot uses `[DEMO]`.
- [ ] At least one public article is open when logged out.
- [ ] At least one members article requires login and opens after login.
- [ ] At least one premium article requires entitlement or approved staff access.
- [ ] Premium body is absent from HTML/source without access.
- [ ] Draft article returns 404 publicly.
- [ ] Future-published article returns 404 before its publication time.
- [ ] Future-published article appears after its time, or an approved simulated verifier demonstrates the transition.
- [ ] Active frontpage slot points to a real published article.
- [ ] SEO title and description exist for launch articles and categories.
- [ ] Canonical URL is correct where configured.
- [ ] Images load; missing media uses the approved fallback without a broken layout.
- [ ] `npm run payload:audit-editorial-content:strict` passes.
- [ ] `npm run payload:verify-public-rendering:strict` passes.

## Backup And Restore Checklist

| Responsibility | Named owner | Evidence/status |
| --- | --- | --- |
| Backup owner | Eivind Von Døhlen | Assigned; restore test passed 13 July 2026 |
| Restore owner | Eivind Von Døhlen | Assigned; restore test passed 13 July 2026 |
| Migration owner | Eivind Von Døhlen | Assigned |
| Deploy owner | Eivind Von Døhlen | Assigned |

- [x] Primary backup method is Supabase managed backups/PITR where the active plan supports it; a reviewed `pg_dump` app-relations dump is taken before cutover.
- [x] Access is restricted to the named operations owner. Restore-test dumps are deleted immediately; the encrypted cutover dump is retained for 7 days after a successful launch, then deleted.
- [x] Restore is tested against a separate non-production Supabase database.
- [x] Restore duration and validation are recorded: relation restore completed in about 20 seconds; 39 tables, 71 constraints, 162 indexes, row counts and strict Payload rendering matched the source.
- [ ] A fresh backup is taken immediately before production migrations or content-source cutover.
- [ ] Backup timestamp and restore owner are added to the release record.
- [ ] Drizzle and Payload migrations are run only by the assigned migration owner.
- [ ] No destructive migration is run without a reviewed data rollback plan.

## Production Cutover Gate

- [ ] Production environment variables are reviewed by two people without displaying secret values.
- [ ] Production database credential has never been shared and the exposed credential is revoked.
- [ ] The production `CONTENT_SOURCE=legacy` or `CONTENT_SOURCE=payload` decision is recorded.
- [ ] DNS, TTL, certificates and public/admin domain plan are approved.
- [ ] Real content and editorial workflow QA are signed off.
- [ ] User-role QA matrix is complete.
- [ ] Backup/restore and migration owners have signed off.
- [ ] Billing remains visibly parked unless a separate full QA approval exists.
- [ ] Email launch state is documented without enabling it in this workstream.
- [ ] Cloudflare launch state is documented without changing its behavior in this workstream.
- [ ] Moderate audit findings have an accepted-risk or remediation owner.
- [ ] Rollback owner and last successful rollback test are recorded.

## Rollback Plan

1. Set the public app deployment environment to `CONTENT_SOURCE=legacy`.
2. Redeploy only the public app from the last known-good commit.
3. Keep Payload Admin and both databases untouched and available for diagnosis.
4. Smoke-test `/`, `/ai`, one legacy article, `/login` and `/min-side`.
5. Check `/nyfrontside1` as a retired route; expected result is 404 unless a separately approved redirect exists.
6. Confirm account/auth data is unchanged and Payload Admin remains reachable.
7. Record rollback time, owner, reason, deployment ID and smoke result.

Rollback does not require reverse migrations or deletion of Payload content.

## Current Decision

`NO-GO for production-default` until PB-01 through PB-06 are done. PB-07 and PB-08 are accepted non-blocking items only after named-owner sign-off.
