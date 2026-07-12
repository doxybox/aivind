# Content Integrations

This phase moves the content architecture to Payload-only CMS while preserving the existing public frontend, routes, layout, navigation, category pages, article pages and visual design.

## Ownership

Payload is the source of truth for all editorial content, including articles, article body, title, slug, authors, categories/sections, publish status, SEO metadata and editorial admin data.

Payload is also the source of truth for internal admin data, media assets, Cloudflare media metadata, reels, tips, ads and frontpage slots.

Cloudflare is the source of truth for media delivery and processing.

Supabase is Postgres only.

Better Auth is the application auth/session system.

Next.js renders the public site.

Ghost is not active in the current architecture. If Ghost is reintroduced later, it must be done as a separate architecture decision.

## Payload

Payload config lives in:

```txt
payload.config.js
src/payload/collections/*
src/payload/access/roles.js
```

Active collections:

- `payload-users`
- `media-assets`
- `categories`
- `authors`
- `articles`
- `frontpage-slots`
- `reels`
- `tip-submissions`
- `ad-campaigns`

`articles`, `categories` and `authors` are now canonical Payload CMS collections. The older `ghost-post-references`, `ghost-tag-references` and `ghost-author-references` collections are not part of the active Payload config.

`frontpage-slots` prepares frontpage curation for public rendering when `CONTENT_SOURCE=payload`. Legacy rendering remains the default.

Payload uses:

- `PAYLOAD_SECRET`
- `DATABASE_URI`, `PAYLOAD_DATABASE_URL`, or `DATABASE_URL` as fallback
- `PAYLOAD_PUBLIC_SERVER_URL`

Payload is configured with `@payloadcms/db-postgres`, so it points at Supabase Postgres through the normal PostgreSQL connection string. Use the existing Supabase Postgres URL, not Supabase Auth.

Useful commands:

```bash
npm run payload:generate-types
npm run payload:migrate
npm run payload-admin:generate-importmap
npm run payload-admin:dev
```

The server-side Payload client lives in:

```txt
src/lib/server/payload-client.js
```

The public-site read bridge for prepared frontpage data lives in:

```txt
src/lib/server/payload-public-data.js
src/pages/api/payload/frontpage.js
```

`GET /api/payload/frontpage` reads active Payload frontpage slots and published reels server-side from Supabase Postgres. Public pages use the same helper layer server-side when `CONTENT_SOURCE=payload`.

Payload Admin is mounted as a separate Next.js app in `payload-admin/` so the existing public site can stay on Pages Router / Next 14. Run it separately from the project root:

```bash
npm run payload-admin:dev
```

Then open:

```txt
http://localhost:3005/admin
```

This admin app uses the root `payload.config.js` and the same Supabase Postgres connection. Payload database changes should go through migrations; automatic dev schema push is disabled with `push: false`.

## Supabase Postgres Connection

Use `DATABASE_URI` for Payload migrations and local admin work. Do not hardcode database passwords in source code, docs or tests.

On a local Windows machine, Supabase direct connection can time out on IPv6. If that happens, use the Supabase Session Pooler connection string from Supabase Dashboard -> Connect -> Session pooler.

Safe PowerShell pattern:

```powershell
Remove-Item Env:DATABASE_URI -ErrorAction SilentlyContinue
$dbPassword = Read-Host "Supabase DB password"
$encodedPassword = [System.Uri]::EscapeDataString($dbPassword)
$env:DATABASE_URI = "postgresql://postgres.<PROJECT_REF>:$encodedPassword@<SESSION_POOLER_HOST>:5432/postgres?sslmode=require&uselibpqcompat=true"
node -e "const u=process.env.DATABASE_URI; console.log(u?.replace(/:[^:@]*@/, ':***@')); console.log(u?.includes('postgres:@') ? 'FEIL: tomt passord' : 'OK: passord finnes')"
npm run payload:migrate
node .\node_modules\payload\bin.js migrate:status
Remove-Item Env:DATABASE_URI
```

## Cloudflare Images And Stream

Server-side Cloudflare helpers live in:

```txt
src/lib/server/cloudflare-media.js
```

API routes:

- `POST /api/cloudflare/images/direct-upload`
- `GET /api/cloudflare/images/[imageId]`
- `DELETE /api/cloudflare/images/[imageId]`
- `POST /api/cloudflare/stream/direct-upload`
- `GET /api/cloudflare/stream/[videoId]`
- `DELETE /api/cloudflare/stream/[videoId]`

These routes require a Better Auth session with one of:

- `journalist`
- `editor`
- `admin`

The frontend never receives the Cloudflare API token.

Required environment variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN`
- `CLOUDFLARE_STREAM_API_TOKEN`

Optional image delivery variables:

- `CLOUDFLARE_IMAGES_ACCOUNT_HASH`
- `CLOUDFLARE_IMAGES_DEFAULT_VARIANT`
- `CLOUDFLARE_STREAM_WEBHOOK_SECRET`

Do not proxy large video files through Next.js. Store Cloudflare provider IDs and metadata in Payload `media-assets`.

Cloudflare Images direct uploads create Payload `media-assets` records with `status=uploading`. The image status route updates the matching media asset with Cloudflare delivery URLs, dimensions and `status=ready` when the upload is available. Delete marks the media asset as `failed` because the collection does not currently have a `deleted` status.

Cloudflare Stream direct uploads create Payload video `media-assets` records with `provider=cloudflare_stream`. When requested, the upload route also creates a draft inactive Payload `reels` record linked to the media asset. Stream status and webhook routes update media status, playback metadata and linked reels without proxying video bytes through Next.js.

## Current Boundary

Not changed in this phase:

- Existing navigation
- Existing routes
- Existing visual design/layout
- Existing SEO rendering
- Existing Better Auth setup

Legacy data remains the default public rendering path. Payload rendering is available only behind the server-side `CONTENT_SOURCE` flag.

## Frontend Content Flag

The public frontend is wired to Payload behind a server-side feature flag:

```txt
CONTENT_SOURCE=legacy
```

Allowed values:

- `legacy`
- `payload`

If `CONTENT_SOURCE` is missing or invalid, the app uses `legacy`. Do not use `NEXT_PUBLIC_` for this flag; the browser does not need it.

With `CONTENT_SOURCE=legacy`, existing hardcoded/mock article data and current rendering paths stay in use.

With `CONTENT_SOURCE=payload`, server-side page loaders read from Payload and pass mapped article/category/reel data into existing components. If Payload has no usable content or a read fails, pages fall back safely to legacy data or empty arrays without exposing database errors to the browser.

Connected behind the flag:

- `/`
- `/artikler/[slug]`
- `/ai`
- `/gaming`
- `/elbil`
- `/gadgets`
- `/tester`
- `/guider`
- `/video`

## Public Payload Helpers

Server-side helpers live in:

```txt
src/lib/server/content-source.js
src/lib/server/payload-public-data.js
```

Prepared helpers:

- `getPublishedArticles(options)`
- `getArticleBySlug(slug)`
- `getArticleByCategoryAndSlug(categorySlug, articleSlug)`
- `getCategories()`
- `getCategoryBySlug(slug)`
- `getArticlesByCategorySlug(slug, options)`
- `getAuthors()`
- `getAuthorBySlug(slug)`
- `getActiveFrontpageSlots()`
- `getHomepageContent()`
- `mapPayloadArticleToLegacyArticle(article)`
- `mapPayloadArticleToPageData(article, options)`
- `mapPayloadCategoryToLegacyCategory(category)`
- `mapPayloadMediaToImage(mediaAsset)`
- `mapPayloadFrontpageSlotToLegacyItem(slot)`

Public helpers only return published articles where `publishedAt <= now`, exclude archived content by status, and log server-side errors without leaking sensitive messages to the client.

## Public Article Route

The stable public article URL pattern is:

```txt
/artikler/[slug]
```

This pattern was selected because existing Payload mappers already generated `/artikler/${slug}`, and it avoids conflicts with top-level category pages such as `/ai`, `/gaming`, `/video`, `/login` and `/min-side`.

With `CONTENT_SOURCE=legacy`, `/artikler/[slug]` can render legacy mock articles by slugified title. With `CONTENT_SOURCE=payload`, it fetches a published Payload article server-side by slug.

The `/ai` route keeps its bespoke visual layout but reads published Payload articles from the `ai` category when `CONTENT_SOURCE=payload`. Draft, scheduled, archived and future-published AI articles are excluded by the shared Payload public helper.

Payload article visibility rules:

- `status` must be `published`.
- `publishedAt` must be in the past.
- `draft`, `review`, `scheduled`, archived and future-published articles are not public.
- restricted `members`/`paid`/`paywallEnabled` articles do not expose full body unless Better Auth server-side entitlement/subscription checks allow access.

Article body is currently stored as Payload textarea content. The public route renders it as plain text paragraphs and does not render arbitrary HTML.

SEO for Payload article pages includes:

- page title
- meta description
- Open Graph title/description/image
- canonical URL when configured
- article published/modified metadata when available

## Testing Payload Frontend Data

To verify the Payload public data bridge:

```bash
npm run payload:verify-public-data
```

The script prints counts for published articles, categories, active frontpage slots, homepage articles and reels. It does not print secrets.

To test the public site locally with Payload content:

1. Set `DATABASE_URI` safely in `.env.local` or the current shell.
2. Set `CONTENT_SOURCE=payload`.
3. Start the public Next.js app.
4. Open `/` or one of the connected category URLs.
5. Open `/artikler/<article-slug>` for a published Payload article.

To roll back instantly:

```txt
CONTENT_SOURCE=legacy
```

or remove `CONTENT_SOURCE` entirely.

## Creating Test Content In Payload

Create a category:

1. Open Payload Admin at `http://localhost:3005/admin`.
2. Go to `Categories`.
3. Create a category with `name`, `slug`, and optionally `existingRoute` such as `/gaming`.
4. Set `isActive` to true.

Create an article:

1. Go to `Articles`.
2. Add `title`, `slug`, `excerpt`, `content`, `status=published`, and `publishedAt` in the past.
3. Attach at least one category.
4. Attach author/media if available.

Create a frontpage slot:

1. Go to `Frontpage Slots`.
2. Set `slotName`, `placement`, `article`, `priority`, and `isActive=true`.
3. Optional: set `startsAt` and `expiresAt`.

If no active frontpage slots exist, the homepage uses latest published Payload articles as fallback when `CONTENT_SOURCE=payload`.
