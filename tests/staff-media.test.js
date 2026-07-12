import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("staff media page is server-side protected and does not expose Cloudflare tokens", () => {
  const page = readProjectFile("src/pages/redaksjon/media.page.jsx");

  assert.match(page, /requireAnyRole\(req, STAFF_ROLES\)/);
  assert.match(page, /const STAFF_ROLES = \["journalist", "editor", "admin"\]/);
  assert.doesNotMatch(page, /CLOUDFLARE_IMAGES_API_TOKEN/);
  assert.doesNotMatch(page, /CLOUDFLARE_STREAM_API_TOKEN/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_CLOUDFLARE/);
});

test("staff media upload UI uses direct Cloudflare upload URLs without sending user id", () => {
  const page = readProjectFile("src/pages/redaksjon/media.page.jsx");

  assert.match(page, /getCloudflareMediaStatus\("images"\)/);
  assert.match(page, /getCloudflareMediaStatus\("stream"\)/);
  assert.match(page, /imagesEnabled/);
  assert.match(page, /streamEnabled/);
  assert.match(page, /Cloudflare mediaopplasting er parkert/);
  assert.match(page, /\/api\/cloudflare\/images\/direct-upload/);
  assert.match(page, /\/api\/cloudflare\/stream\/direct-upload/);
  assert.match(page, /directUpload\.uploadURL/);
  assert.match(page, /fileMimeType: imageFile\.type/);
  assert.match(page, /fileSizeBytes: imageFile\.size/);
  assert.match(page, /fileMimeType: videoFile\.type/);
  assert.match(page, /fileSizeBytes: videoFile\.size/);
  assert.match(page, /IMAGE_UPLOAD_LIMITS/);
  assert.match(page, /VIDEO_UPLOAD_LIMITS/);
  assert.doesNotMatch(page, /userId/);
  assert.doesNotMatch(page, /uploadedByAuthUserId/);
});

test("staff media list API is staff-only and returns safe fields", () => {
  const api = readProjectFile("src/pages/api/staff/media-assets.js");

  assert.match(api, /requireAnyRole\(req, \["journalist", "editor", "admin"\]\)/);
  assert.match(api, /enforceRateLimit/);
  assert.match(api, /collection: "media-assets"/);
  assert.match(api, /cloudflareImageId/);
  assert.match(api, /cloudflareStreamUid/);
  assert.doesNotMatch(api, /metadata:/);
  assert.doesNotMatch(api, /uploadedBy:/);
  assert.doesNotMatch(api, /CLOUDFLARE_IMAGES_API_TOKEN/);
  assert.doesNotMatch(api, /CLOUDFLARE_STREAM_API_TOKEN/);
});

test("media upload rate-limit helper is server-only and avoids secrets", () => {
  const rateLimit = readProjectFile("src/lib/server/rate-limit.js");
  const audit = readProjectFile("src/lib/server/media-upload-audit.js");
  const imageRoute = readProjectFile("src/pages/api/cloudflare/images/direct-upload.js");
  const streamRoute = readProjectFile("src/pages/api/cloudflare/stream/direct-upload.js");
  const migration = readProjectFile("src/migrations/20260629_034500_make_media_assets_legacy_kind_nullable.ts");

  assert.match(rateLimit, /class RateLimitError/);
  assert.match(rateLimit, /x-forwarded-for/);
  assert.match(readProjectFile("src/lib/server/cloudflare-media.js"), /CLOUDFLARE_MEDIA_ENABLED/);
  assert.match(imageRoute, /userLimit:\s*12/);
  assert.match(streamRoute, /userLimit:\s*8/);
  assert.match(audit, /\[media-upload\]/);
  assert.doesNotMatch(audit, /TOKEN|SECRET|PASSWORD/i);
  assert.match(migration, /ALTER COLUMN "kind" DROP NOT NULL/);
});
