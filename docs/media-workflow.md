# Staff Media Workflow

The internal staff media route is:

- `/redaksjon/media`

It is protected server-side with Better Auth roles:

- `journalist`
- `editor`
- `admin`

The public homepage, category pages, article pages and navigation are not changed by this workflow.

The browser never sends or controls `userId`. Upload ownership is derived server-side from the Better Auth session.

## Current Status

Cloudflare Images/Stream upload is currently parked until the customer activates and pays for the required quotas. The code remains in place, but upload UI and upload APIs require:

```env
CLOUDFLARE_MEDIA_ENABLED=true
```

Without that explicit flag, staff users see a disabled explanation and direct-upload APIs return a safe disabled response instead of trying to create Cloudflare upload URLs.

## Image Upload

The image form calls `POST /api/cloudflare/images/direct-upload` with editorial metadata. The API creates a Payload `media-assets` record and returns a Cloudflare direct upload URL.

The browser uploads the selected image file directly to Cloudflare Images using that `uploadURL`. Next.js does not proxy image bytes.

After upload, the UI calls `GET /api/cloudflare/images/[imageId]` to refresh the Payload media asset status and metadata.

Current image guardrails:

- MIME whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Max image size: 10 MB
- Direct upload URL rate limit: 12 per user and 30 per IP per 10 minutes

## Video Upload

The video form calls `POST /api/cloudflare/stream/direct-upload` with title, description, original filename, and optional reel fields.

The API creates a Payload `media-assets` video record. If `createReel=true`, it also creates a draft inactive Payload `reels` record linked to that media asset.

The browser uploads the selected video file directly to Cloudflare Stream using the returned `uploadURL`. Next.js does not proxy video bytes.

After upload, the UI calls `GET /api/cloudflare/stream/[videoId]` to refresh status, playback URL, thumbnail URL, duration and dimensions.

Current video guardrails:

- MIME whitelist: `video/mp4`, `video/quicktime`, `video/webm`
- Max video size: 500 MB
- Direct upload URL rate limit: 8 per user and 20 per IP per 10 minutes
- `createReel=true` creates a draft, inactive Payload reel

## Recent Media List

`GET /api/staff/media-assets` lists recent Payload media assets for staff users only.

The staff list and Cloudflare status/delete routes also use staff-only API rate limits.

Returned fields are intentionally limited:

- `id`
- `title`
- `type`
- `provider`
- `status`
- `deliveryUrl`
- `thumbnailUrl`
- `cloudflareImageId`
- `cloudflareStreamUid`
- `createdAt`
- `updatedAt`

Internal metadata and secrets are not returned.

## Payload Usage

The current Payload schema already has media relationships:

- `articles.heroMedia`
- `articles.seoImage`
- `authors.profileImage`
- `frontpage-slots.mediaAsset`
- `reels.mediaAsset`
- `ad-campaigns.mediaAsset`

Editors can select uploaded media assets from these relationship fields in Payload Admin. No schema or migration was added for this workflow.

## Required Environment Variables

Server-side Cloudflare API routes need:

- `CLOUDFLARE_MEDIA_ENABLED=true`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN` or `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_IMAGES_ACCOUNT_HASH`
- `CLOUDFLARE_STREAM_API_TOKEN` or `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_STREAM_WEBHOOK_SECRET` if the Stream webhook is enabled

Do not expose these as `NEXT_PUBLIC_*`.

## Manual QA

1. Sign in as a user with `journalist`, `editor` or `admin`.
2. Open `/redaksjon/media`.
3. Upload an image and confirm a Payload `media-assets` image appears.
4. Click status refresh and confirm the media asset updates to `ready` when Cloudflare reports it.
5. Upload a video and confirm a Payload `media-assets` video appears.
6. Upload a video with `createReel=true` and confirm a draft inactive Payload `reels` record is created.
7. Sign in as a non-staff user and confirm `/redaksjon/media` and `/api/staff/media-assets` are not accessible.

## Known Limitations

The route is intentionally minimal and does not replace Payload Admin. It gives staff a fast direct upload workflow and a recent media overview. Advanced editing, publishing and content placement still happen in Payload Admin.
