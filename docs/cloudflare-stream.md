# Cloudflare Stream

Cloudflare Stream is used for direct video uploads. Payload `media-assets` stores the video record, and Payload `reels` can optionally be created for short video surfaces.

## Required Env Vars

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`

Optional:

- `CLOUDFLARE_API_TOKEN` as a fallback token if `CLOUDFLARE_STREAM_API_TOKEN` is not set
- `CLOUDFLARE_STREAM_WEBHOOK_SECRET`

Never expose Cloudflare API tokens to the browser.

## Staff Access

The Stream upload/status APIs require a Better Auth session with one of:

- `journalist`
- `editor`
- `admin`

The frontend must not send `userId`. Upload ownership is derived server-side from the authenticated session and stored in media metadata. If a matching Payload admin user exists, `uploadedBy` is linked.

## Direct Upload Flow

`POST /api/cloudflare/stream/direct-upload`

Accepted optional metadata:

- `title`
- `description`
- `originalFilename`
- `requireSignedUrl`
- `requireSignedURLs`
- `createReel`
- `reelSlug`
- `maxDurationSeconds`
- `thumbnailTimestampPct`
- `expiry`

The API:

1. Checks Better Auth session and staff role.
2. Validates the request body.
3. Calls Cloudflare Stream direct upload server-side.
4. Creates a Payload `media-assets` record with `type=video`, `provider=cloudflare_stream`, and `status=uploading`.
5. If `createReel=true`, creates a Payload `reels` record linked to the media asset as `draft` and inactive.
6. Returns only safe data:
   - `uploadURL`
   - `cloudflareStreamUid`
   - `mediaAsset`
   - `reel`

The video file itself is uploaded directly to Cloudflare using `uploadURL`; Next.js does not proxy video bytes.

Staff can use `/redaksjon/media` for this workflow instead of calling the API manually. The route is protected with the same `journalist`, `editor` and `admin` role checks.

## Status Flow

`GET /api/cloudflare/stream/[videoId]`

The API:

1. Checks Better Auth session and staff role.
2. Fetches video details from Cloudflare server-side.
3. Finds the matching Payload `media-assets` record by `cloudflareStreamUid`.
4. Updates playback URL, thumbnail URL, dimensions, duration, metadata and status.
5. Updates linked `reels` records when the media status requires it.

Status mapping:

- Cloudflare ready -> Payload media `ready`
- Cloudflare failed/error -> Payload media `failed`
- Cloudflare processing states -> Payload media `processing` or `uploading`

## Delete Flow

`DELETE /api/cloudflare/stream/[videoId]`

The API deletes the video from Cloudflare, marks the matching Payload `media-assets` record as `failed`, and archives linked `reels` records.

Payload `media-assets` does not currently have a `deleted` status, so no schema change was made for deletion in this pass.

## Webhook

`POST /api/cloudflare/stream/webhook`

If `CLOUDFLARE_STREAM_WEBHOOK_SECRET` is configured, the route requires the same secret in one of:

- `x-cloudflare-stream-webhook-secret`
- `x-webhook-secret`
- `Authorization: Bearer <secret>`

The route parses the Cloudflare Stream payload, updates the matching Payload `media-assets` record, and updates linked `reels`.

In local development, if no webhook secret is configured, the route still accepts payloads so the integration can be tested manually.

## Manual Test

1. Log in as a user with `journalist`, `editor` or `admin` role.
2. Make sure the required Cloudflare env vars are set server-side.
3. `POST /api/cloudflare/stream/direct-upload` with `title`, `description`, `originalFilename`, and optionally `createReel=true`.
4. Upload the file directly to the returned `uploadURL`.
5. Call `GET /api/cloudflare/stream/<cloudflareStreamUid>`.
6. Confirm the matching Payload `media-assets` record updates to `processing` or `ready`.
7. If a reel was created, confirm it is linked to the media asset.

## Limitations

- Public frontend rendering was not changed.
- No video bytes pass through Next.js.
- Reels created by the upload API start as `draft` and inactive; editorial publish remains a Payload/admin decision.
