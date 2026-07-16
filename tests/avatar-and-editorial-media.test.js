import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { Authors } from "../src/payload/collections/Authors.js";
import { Articles } from "../src/payload/collections/Articles.js";
import { MediaAssets } from "../src/payload/collections/MediaAssets.js";
import {
  AvatarUploadValidationError,
  AVATAR_UPLOAD_LIMITS,
  isTrustedAvatarUrl,
  validateAvatarDirectUploadInput,
} from "../src/lib/server/avatar-upload-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("avatar input accepts safe image metadata and rejects user-controlled ownership", () => {
  const clean = validateAvatarDirectUploadInput({
    fileMimeType: "image/webp",
    fileSizeBytes: 120_000,
    originalFilename: "avatar.webp",
  });

  assert.equal(clean.fileMimeType, "image/webp");
  assert.throws(
    () => validateAvatarDirectUploadInput({ ...clean, userId: "other-user" }),
    AvatarUploadValidationError,
  );
  assert.throws(
    () => validateAvatarDirectUploadInput({ ...clean, fileSizeBytes: AVATAR_UPLOAD_LIMITS.maxBytes + 1 }),
    AvatarUploadValidationError,
  );
  assert.throws(
    () => validateAvatarDirectUploadInput({ ...clean, fileMimeType: "image/gif" }),
    AvatarUploadValidationError,
  );
});

test("profile images only accept Cloudflare Images delivery URLs", () => {
  assert.equal(isTrustedAvatarUrl(""), true);
  assert.equal(isTrustedAvatarUrl("https://imagedelivery.net/account/image/public"), true);
  assert.equal(isTrustedAvatarUrl("https://example.com/avatar.jpg"), false);
  assert.equal(isTrustedAvatarUrl("javascript:alert(1)"), false);
});

test("avatar API derives the owner from Better Auth and has rate limiting", () => {
  const route = readProjectFile("src/pages/api/account/avatar/direct-upload.js");

  assert.match(route, /requireAuth\(req\)/);
  assert.match(route, /validateAvatarDirectUploadInput/);
  assert.match(route, /enforceRateLimit/);
  assert.match(route, /session\.user\.id/);
  assert.doesNotMatch(route, /req\.body\.userId/);
  assert.doesNotMatch(route, /CLOUDFLARE_IMAGES_API_TOKEN/);
});

test("Payload requires author profile images and exposes staff-only image and video uploaders", () => {
  const profileImage = Authors.fields.find((field) => field.name === "profileImage");
  const articleAuthors = Articles.fields.find((field) => field.name === "authors");
  assert.equal(profileImage.required, true);
  assert.equal(articleAuthors.required, true);
  assert.equal(MediaAssets.admin.components.beforeList.includes("./src/payload/components/MediaAssetUploader.jsx"), true);
  assert.equal(MediaAssets.endpoints.some((endpoint) => endpoint.path === "/cloudflare-direct-upload"), true);
  assert.equal(MediaAssets.endpoints.some((endpoint) => endpoint.path === "/cloudflare-stream-direct-upload"), true);

  const endpoint = readProjectFile("src/payload/endpoints/media-assets-cloudflare.js");
  const component = readProjectFile("src/payload/components/MediaAssetUploader.jsx");
  assert.match(endpoint, /hasPayloadRole/);
  assert.match(endpoint, /createImageDirectUpload/);
  assert.match(endpoint, /createStreamDirectUpload/);
  assert.match(endpoint, /createMediaAssetForImageDirectUpload/);
  assert.match(endpoint, /createMediaAssetForStreamDirectUpload/);
  assert.match(endpoint, /validateStreamDirectUploadInput/);
  assert.doesNotMatch(endpoint, /CLOUDFLARE_IMAGES_API_TOKEN/);
  assert.doesNotMatch(endpoint, /CLOUDFLARE_STREAM_API_TOKEN/);
  assert.match(component, /cloudflare-direct-upload/);
  assert.match(component, /cloudflare-stream-direct-upload/);
  assert.match(component, /application\/offset\+octet-stream/);
  assert.match(component, /FormData/);
});
