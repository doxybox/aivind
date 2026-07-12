import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  CloudflareImagesValidationError,
  IMAGE_UPLOAD_LIMITS,
  validateImageDirectUploadInput,
  validateImageId,
} from "../src/lib/server/cloudflare-images-policy.js";
import { normalizeCloudflareImage } from "../src/lib/server/media-assets-service.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("Cloudflare Images upload input accepts safe metadata", () => {
  const clean = validateImageDirectUploadInput({
    title: "Hero image",
    alt: "Robot ved datamaskin",
    caption: "Illustrasjon",
    credit: "AIVIND",
    usageRights: "Redaksjonell bruk",
    originalFilename: "hero.jpg",
    fileMimeType: "image/jpeg",
    fileSizeBytes: 512000,
    requireSignedURLs: false,
  });

  assert.equal(clean.title, "Hero image");
  assert.equal(clean.alt, "Robot ved datamaskin");
  assert.equal(clean.originalFilename, "hero.jpg");
  assert.equal(clean.fileMimeType, "image/jpeg");
  assert.equal(clean.fileSizeBytes, 512000);
  assert.equal(clean.requireSignedURLs, false);
});

test("Cloudflare Images upload input rejects user id, unknown fields and invalid file metadata", () => {
  assert.throws(
    () => validateImageDirectUploadInput({
      title: "Hero",
      userId: "other-user",
      fileMimeType: "image/jpeg",
      fileSizeBytes: 512000,
    }),
    CloudflareImagesValidationError,
  );
  assert.throws(
    () => validateImageDirectUploadInput({
      title: "Hero",
      role: "admin",
      fileMimeType: "image/jpeg",
      fileSizeBytes: 512000,
    }),
    CloudflareImagesValidationError,
  );
  assert.throws(
    () => validateImageDirectUploadInput({
      title: "Hero",
      fileMimeType: "image/jpeg",
      fileSizeBytes: 512000,
      requireSignedURLs: "false",
    }),
    CloudflareImagesValidationError,
  );
  assert.throws(
    () => validateImageDirectUploadInput({
      title: "Hero",
      fileMimeType: "image/gif",
      fileSizeBytes: 512000,
    }),
    CloudflareImagesValidationError,
  );
  assert.throws(
    () => validateImageDirectUploadInput({
      title: "Hero",
      fileMimeType: "image/jpeg",
      fileSizeBytes: IMAGE_UPLOAD_LIMITS.maxBytes + 1,
    }),
    CloudflareImagesValidationError,
  );
  assert.throws(
    () => validateImageDirectUploadInput({ title: "Hero" }),
    CloudflareImagesValidationError,
  );
});

test("Cloudflare image id validation rejects unsafe ids", () => {
  assert.equal(validateImageId("abc_123-XYZ"), "abc_123-XYZ");
  assert.throws(() => validateImageId("../secret"), CloudflareImagesValidationError);
});

test("Cloudflare image details normalize to Payload-safe metadata", () => {
  const image = normalizeCloudflareImage({
    result: {
      id: "image-id",
      uploaded: "2026-06-29T10:00:00.000Z",
      variants: ["https://imagedelivery.net/account/image-id/public"],
      meta: { width: 1200, height: 800, originalFilename: "hero.jpg" },
    },
  });

  assert.equal(image.cloudflareImageId, "image-id");
  assert.equal(image.deliveryUrl, "https://imagedelivery.net/account/image-id/public");
  assert.equal(image.width, 1200);
  assert.equal(image.height, 800);
  assert.equal(image.status, "ready");
});

test("Cloudflare Images API routes require staff auth and persist Payload media-assets", () => {
  const uploadRoute = readProjectFile("src/pages/api/cloudflare/images/direct-upload.js");
  const imageRoute = readProjectFile("src/pages/api/cloudflare/images/[imageId].js");
  const service = readProjectFile("src/lib/server/media-assets-service.js");

  assert.match(uploadRoute, /requireAnyRole\(req, \["journalist", "editor", "admin"\]\)/);
  assert.match(uploadRoute, /validateImageDirectUploadInput/);
  assert.match(uploadRoute, /enforceRateLimit/);
  assert.match(uploadRoute, /createMediaAssetForImageDirectUpload/);
  assert.doesNotMatch(uploadRoute, /CLOUDFLARE_IMAGES_API_TOKEN/);

  assert.match(imageRoute, /requireAnyRole\(req, \["journalist", "editor", "admin"\]\)/);
  assert.match(imageRoute, /updateMediaAssetFromCloudflareImage/);
  assert.match(imageRoute, /markMediaAssetImageDeleted/);

  assert.match(service, /collection:\s*MEDIA_COLLECTION/);
  assert.match(service, /cloudflareImageId/);
  assert.match(service, /provider:\s*"cloudflare_images"/);
  assert.match(service, /status:\s*"failed"/);
});
