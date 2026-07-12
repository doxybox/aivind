# Final Staging QA Checklist

Last updated: 13 July 2026

Staging URLs:

- Public: `https://staging.tekkno.no`
- Payload Admin: `https://admin-staging.tekkno.no/admin`

Source of truth for open blockers: `docs/production-blockers.md`.

## Baseline

- [x] Public staging is deployed.
- [x] Payload Admin staging is deployed.
- [x] `CONTENT_SOURCE=payload` is configured for staging.
- [x] Strict Payload public-rendering verifier passes.
- [x] Anonymous public smoke, health, 404 and protected-route checks pass.
- [x] No high or critical npm audit findings.
- [x] Billing/Vipps is parked.
- [ ] Real non-demo editorial content is present.
- [ ] Future-publish workflow is tested.
- [ ] Logged-in role matrix is signed off.
- [x] Database credential rotation is complete.
- [x] Backup/restore ownership is assigned and tested.

## Anonymous Browser QA

- [ ] `/` renders Payload content without an error overlay.
- [ ] `/ai` renders the AI category.
- [ ] `/gaming` renders the gaming category.
- [ ] Public article is readable.
- [ ] Members article shows login CTA without body leakage.
- [ ] Premium article shows login/subscribe CTA without body leakage.
- [ ] Draft slug returns 404.
- [ ] Future slug returns 404 before publication.
- [ ] Unknown slug returns 404.
- [ ] `/min-side` redirects to login.
- [ ] `/redaksjon/media` redirects or denies access.
- [ ] `/abonnement` truthfully presents parked billing.
- [ ] Payload Admin opens its login page.
- [ ] No hydration errors, broken images or obvious layout breaks are visible.

## Logged-In QA

- [ ] Reader can log in and access only their own account data.
- [ ] Reader can save/remove their own articles.
- [ ] Reader can read and update their own newsletter preferences.
- [ ] Reader can access members content but not premium content.
- [ ] Subscriber/member behavior matches database entitlements.
- [ ] Premium test user can access premium body.
- [ ] Premium body remains absent for users without entitlement.
- [ ] Staff role can access `/redaksjon/media`.
- [ ] Non-staff receives 403 or redirect from staff surfaces.
- [ ] Payload admin/editor can open permitted collections.
- [ ] Public users cannot self-assign staff roles.

## Editorial Workflow QA

- [ ] Create a real article.
- [ ] Assign real author and category.
- [ ] Set and edit slug.
- [ ] Save as draft and confirm public 404.
- [ ] Publish and confirm frontend rendering.
- [ ] Test public, members and paid access levels.
- [ ] Schedule a future publication and verify before/after behavior.
- [ ] Create or update a frontpage slot and confirm homepage placement.
- [ ] Test missing image, author and category fallbacks.
- [ ] Remove/archive all demo records before production approval.

## Operational QA

- [x] Rotate Supabase credential and revoke the old one.
- [x] Update both Vercel projects and redeploy without cache.
- [x] Run `npm run db:verify-rate-limit` against the target database.
- [x] Run the public smoke script against staging.
- [x] Confirm `/api/health` returns 200.
- [x] Confirm public and admin Vercel logs contain no new 5xx errors.
- [x] Record backup, restore, migration and deploy owners.
- [x] Complete a non-production restore test (passed 13 July 2026).
- [ ] Confirm rollback to `CONTENT_SOURCE=legacy` is understood and assigned.

## Automated Checks

```bash
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run payload-admin:build
npm run payload:verify-public-rendering:strict
npm run payload:audit-editorial-content:strict
```

## Sign-Off

```txt
Date:
Release candidate commit:
Editorial owner:
QA owner:
Database/restore owner: Eivind Von Døhlen
Deploy owner: Eivind Von Døhlen

Anonymous QA: pass / fail
Logged-in role QA: pass / fail
Editorial workflow QA: pass / fail
Backup/restore QA: pass / fail
Rollback reviewed: yes / no

Decision: go / no-go
Open blocker IDs:
Notes:
```
