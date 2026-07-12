# Cloudflare Images

Cloudflare Images is used for direct image uploads. Payload `media-assets` stores the editorial media record that can later be attached to articles, frontpage slots, authors and ads.

## Required Env Vars

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_API_TOKEN`
- `CLOUDFLARE_IMAGES_ACCOUNT_HASH`

Optional:

- `CLOUDFLARE_IMAGES_DEFAULT_VARIANT`
- `CLOUDFLARE_API_TOKEN` as a fallback token if `CLOUDFLARE_IMAGES_API_TOKEN` is not set

Never expose Cloudflare API tokens to the browser.

## Staff Access

The image upload/status APIs require a Better Auth session with one of:

- `journalist`
- `editor`
- `admin`

The frontend must not send `userId`. Upload ownership is derived server-side from the authenticated session and stored in media metadata. If a matching Payload admin user exists, `uploadedBy` is linked.

## Direct Upload Flow

`POST /api/cloudflare/images/direct-upload`

Accepted optional metadata:

- `title`
- `alt`
- `caption`
- `credit`
- `usageRights`
- `originalFilename`
- `requireSignedURLs`
- `expiry`

The API:

1. Checks Better Auth session and staff role.
2. Validates the request body.
3. Calls Cloudflare Images direct upload server-side.
4. Creates a Payload `media-assets` record with `status=uploading`.
5. Returns only safe data:
   - `uploadURL`
   - `cloudflareImageId`
   - `mediaAsset`

The image file itself is uploaded directly to Cloudflare using `uploadURL`; Next.js does not proxy the image bytes.

Staff can use `/redaksjon/media` for this workflow instead of calling the API manually. The route is protected with the same `journalist`, `editor` and `admin` role checks.

## Status Flow

`GET /api/cloudflare/images/[imageId]`

The API:

1. Checks Better Auth session and staff role.
2. Fetches image details from Cloudflare server-side.
3. Finds the matching Payload `media-assets` record by `cloudflareImageId`.
4. Updates delivery URL, thumbnail URL, dimensions, metadata and status.
5. Sets `status=ready` when Cloudflare reports the image as uploaded and not draft.

## Delete Flow

`DELETE /api/cloudflare/images/[imageId]`

The API deletes the image from Cloudflare and marks the matching Payload `media-assets` record as `failed`.

Payload `media-assets` does not currently have a `deleted` status, so no schema change was made for deletion in this pass.

## Manual Test

1. Log in as a user with `journalist`, `editor` or `admin` role.
2. Make sure the required Cloudflare env vars are set server-side.
3. `POST /api/cloudflare/images/direct-upload` with metadata such as `title`, `alt` and `originalFilename`.
4. Upload the file directly to the returned `uploadURL`.
5. Call `GET /api/cloudflare/images/<cloudflareImageId>`.
6. Confirm the matching Payload `media-assets` record is updated to `ready`.

## Limitations

- This task covers Cloudflare Images only, not Stream/video.
- No avatar upload UI was connected.
- No public rendering changes were made.
- No Cloudflare upload bytes pass through Next.js.
