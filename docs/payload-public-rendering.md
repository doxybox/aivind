# Payload Public Rendering

Payload public rendering is available behind the server-side feature flag:

```env
CONTENT_SOURCE=payload
```

Default is:

```env
CONTENT_SOURCE=legacy
```

Do not expose this as `NEXT_PUBLIC_CONTENT_SOURCE`. The browser does not need to know which backend source was selected.

## Article URLs

Public article pages use:

```txt
/artikler/[slug]
```

This avoids conflicts with existing top-level pages and category URLs.

## Create Content

Create a Payload category:

1. Open Payload Admin.
2. Go to `Categories`.
3. Create `name`, `slug`, optional `existingRoute`, and keep `isActive=true`.

Create a Payload article:

1. Go to `Articles`.
2. Set `title`, `slug`, `excerpt`, `content`.
3. Set `status=published`.
4. Set `publishedAt` to a time in the past.
5. Attach category, author and media if available.

Create a frontpage slot:

1. Go to `Frontpage Slots`.
2. Pick an article.
3. Set `placement`, `priority` and `isActive=true`.
4. Optional: set `startsAt` and `expiresAt`.

The collection also contains hidden legacy compatibility fields (`label`, `slot`, `position`) because the existing Supabase/Payload table still has not-null legacy columns. Editors should use `slotName`, `placement` and `priority`; the hidden fields are populated with safe defaults.

## Verify Public Rendering Data

Run the read-only verification script:

```bash
npm run payload:verify-public-rendering
```

The script connects through the existing server-side Payload setup and prints safe counts for:

- published articles
- categories
- authors
- active frontpage slots
- homepage articles
- reels

It does not print secrets. Empty content produces warnings, not a failing exit code.

Homepage rendering is article/slot-first. `frontpage-slots` and latest published articles are required for the Payload staging switch; reels are optional because Cloudflare media/runtime is parked. If the optional reels lookup fails or returns no published reels, the homepage must still return `homepageArticles` from slots/latest articles.

For stricter QA where empty content should fail:

```bash
npm run payload:verify-public-rendering -- --strict
```

The script also prints suggested URLs to verify, such as:

- `/`
- `/gaming` or the first active Payload category route
- `/artikler/<published-article-slug>`

## Optional Demo Seed

If the local/staging Payload database has no content, you can manually seed demo content:

```bash
npm run payload:seed-demo-content
```

This creates demo-marked content only when matching slugs do not already exist:

- categories:
  - `ai`
  - `gaming`
- author: `demo-redaksjonen`
- articles:
  - `demo-payload-driver-ai-forsiden`
  - `demo-ai-medlemssak-fra-payload`
  - `demo-ai-paywall-skjuler-fulltekst`
  - `demo-ai-draft-skal-ikke-lekke`
  - `demo-ai-future-skal-ikke-lekke`
  - `demo-gamingkategori-fra-payload`
- one active frontpage slot

The seed script is manual and does not run during build/test. It refuses to run in production unless this is explicitly set:

```bash
ALLOW_PAYLOAD_DEMO_SEED=true
```

## Connected Pages

Connected when `CONTENT_SOURCE=payload`:

- `/`
- `/artikler/[slug]`
- `/ai`
- `/gaming`
- `/elbil`
- `/gadgets`
- `/tester`
- `/guider`
- `/video`

`/ai` uses its bespoke newspaper layout, but swaps its article data to published Payload articles in the `ai` category when `CONTENT_SOURCE=payload`. If no published AI articles exist, it shows an empty Payload state instead of falling back to Base44/Ghost.

`/` uses `getHomepageContent()` when `CONTENT_SOURCE=payload`. Active `frontpage-slots` are mapped first, followed by latest published articles. The existing visual grid is preserved: Payload articles can fill the hero, top stories, section cards and "Siste saker", while legacy hardcoded cards remain the fallback when Payload has no data.

Reels in `getHomepageContent()` are optional for staging. A missing or temporarily incompatible reels query returns an empty reels array and must not discard homepage articles.

## Browser QA Result 2026-06-29

Runtime QA was run locally with the public app started as `CONTENT_SOURCE=payload npm run dev` and Payload Admin started separately on `http://localhost:3005/admin`.

Verified public routes:

- `/` renders Payload homepage content from the active demo frontpage slot and latest published articles.
- `/ai` renders published Payload articles in the `ai` category and does not show draft or future-published demo content.
- `/artikler/demo-payload-driver-ai-forsiden` renders as a public article.
- `/artikler/demo-ai-medlemssak-fra-payload` hides the body while logged out and shows it when logged in.
- `/artikler/demo-ai-paywall-skjuler-fulltekst` hides premium body content without entitlement and shows full body after a dev/test `premium` entitlement is granted.
- Unknown, draft and future article slugs return 404.

Verified safety checks:

- Premium body text was not present in the logged-out HTML/page source.
- Draft and future demo article body text was not present in 404 responses.
- No browser console errors or hydration overlays were observed on the tested public routes.
- Fallback article images work without Cloudflare.
- External stock-logo failures fall back to local ticker badges instead of broken images.

Verified Payload Admin workflow:

- `http://localhost:3005/admin` loads with the separate Payload Admin app.
- A local QA admin user can sign in.
- Demo articles, categories, author and frontpage slot are visible in their collections.
- The public app remains on Pages Router; the admin app remains separate.

Browser QA limitations:

- The manual QA used demo seed data and a local QA user, not production editorial content.
- No production payment, Vipps or Cloudflare media runtime was tested.
- Reels/media runtime remains parked. `homepageReels=0` is acceptable for staging as long as homepage articles/frontpage slots are present.
- A new manual article was not created during this pass because seeded content already covered public, members, paid, draft and future states.

Minimum content before switching staging to `CONTENT_SOURCE=payload`:

- At least one active category with a stable `slug` and `existingRoute`.
- At least one active author.
- Published articles with past `publishedAt` values.
- One active frontpage slot for the hero/top story area.
- Fallback-safe image handling for articles that do not have media.

For the full staging checklist with real editorial content, see:

```txt
docs/payload-staging-readiness.md
```

## Rollback

To return to legacy rendering:

```env
CONTENT_SOURCE=legacy
```

or remove `CONTENT_SOURCE` entirely.

## Local QA Steps

1. Make sure Payload Admin can connect to the same Supabase Postgres database.
2. Create content manually in Payload Admin, or run `npm run payload:seed-demo-content`.
3. Run `npm run payload:verify-public-rendering`.
4. Set:

```env
CONTENT_SOURCE=payload
```

5. Start the public app.
6. Verify `/`.
7. Verify `/ai`.
9. Verify `/gaming` or the category printed by the verifier.
10. Verify `/artikler/demo-payload-driver-ai-forsiden` or the article printed by the verifier.
11. Verify `/artikler/demo-ai-medlemssak-fra-payload` while logged out and logged in.
12. Verify `/artikler/demo-ai-paywall-skjuler-fulltekst` without entitlement and with a test entitlement.
13. Verify `/artikler/demo-ai-draft-skal-ikke-lekke` returns 404.
14. Verify `/artikler/demo-ai-future-skal-ikke-lekke` returns 404 before its future `publishedAt`.
15. Roll back by setting `CONTENT_SOURCE=legacy` or removing the env var.

## Known Blockers

- Legacy homepage still contains hardcoded editorial fallback cards when Payload has no homepage data.
- Article body is textarea/plain text, not rich text.
- Restricted article access is safe but minimal: body is hidden without server-side entitlement/subscription access.
- Cloudflare media persistence is not complete.
- Base44 cleanup is staged and still has isolated compatibility shims.
