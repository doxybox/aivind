import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  CloudflareStreamValidationError,
  STREAM_UPLOAD_LIMITS,
  slugifyReelTitle,
  validateStreamDirectUploadInput,
  validateStreamWebhookRequest,
  validateVideoId,
} from "../src/lib/server/cloudflare-stream-policy.js";
import { normalizeCloudflareStream } from "../src/lib/server/media-assets-service.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("Cloudflare Stream upload input accepts safe metadata and reel creation", () => {
  const clean = validateStreamDirectUploadInput({
    title: "Ukens AI-reel",
    description: "Kort video",
    originalFilename: "ai-reel.mp4",
    fileMimeType: "video/mp4",
    fileSizeBytes: 2 * 1024 * 1024,
    requireSignedUrl: false,
    createReel: true,
  });

  assert.equal(clean.title, "Ukens AI-reel");
  assert.equal(clean.description, "Kort video");
  assert.equal(clean.originalFilename, "ai-reel.mp4");
  assert.equal(clean.fileMimeType, "video/mp4");
  assert.equal(clean.fileSizeBytes, 2 * 1024 * 1024);
  assert.equal(clean.createReel, true);
  assert.equal(clean.reelSlug, "ukens-ai-reel");
});

test("Cloudflare Stream upload input rejects user id, unknown fields and invalid file metadata", () => {
  assert.throws(
    () => validateStreamDirectUploadInput({
      title: "Reel",
      userId: "other-user",
      fileMimeType: "video/mp4",
      fileSizeBytes: 1024,
    }),
    CloudflareStreamValidationError,
  );
  assert.throws(
    () => validateStreamDirectUploadInput({
      title: "Reel",
      role: "admin",
      fileMimeType: "video/mp4",
      fileSizeBytes: 1024,
    }),
    CloudflareStreamValidationError,
  );
  assert.throws(
    () => validateStreamDirectUploadInput({
      title: "Reel",
      fileMimeType: "video/mp4",
      fileSizeBytes: 1024,
      createReel: "true",
    }),
    CloudflareStreamValidationError,
  );
  assert.throws(
    () => validateStreamDirectUploadInput({
      title: "Reel",
      fileMimeType: "video/x-msvideo",
      fileSizeBytes: 1024,
    }),
    CloudflareStreamValidationError,
  );
  assert.throws(
    () => validateStreamDirectUploadInput({
      title: "Reel",
      fileMimeType: "video/mp4",
      fileSizeBytes: STREAM_UPLOAD_LIMITS.maxBytes + 1,
    }),
    CloudflareStreamValidationError,
  );
  assert.throws(
    () => validateStreamDirectUploadInput({ title: "Reel" }),
    CloudflareStreamValidationError,
  );
});

test("Cloudflare Stream video id and reel slug validation are strict", () => {
  assert.equal(validateVideoId("stream_uid-123"), "stream_uid-123");
  assert.equal(slugifyReelTitle("ÆØÅ AI reel!"), "a-ai-reel");
  assert.throws(() => validateVideoId("../secret"), CloudflareStreamValidationError);
  assert.throws(
    () => validateStreamDirectUploadInput({
      createReel: true,
      reelSlug: "../bad",
      fileMimeType: "video/mp4",
      fileSizeBytes: 1024,
    }),
    CloudflareStreamValidationError,
  );
});

test("Cloudflare Stream details normalize to Payload-safe metadata", () => {
  const video = normalizeCloudflareStream({
    result: {
      uid: "video-uid",
      readyToStream: true,
      duration: 31.5,
      thumbnail: "https://customer.cloudflarestream.com/video-uid/thumbnail.jpg",
      playback: { hls: "https://customer.cloudflarestream.com/video-uid/manifest/video.m3u8" },
      input: { width: 1080, height: 1920 },
    },
  });

  assert.equal(video.cloudflareStreamUid, "video-uid");
  assert.equal(video.status, "ready");
  assert.equal(video.duration, 31.5);
  assert.equal(video.width, 1080);
  assert.equal(video.height, 1920);
});

test("Cloudflare Stream webhook validates secret when configured", () => {
  assert.equal(
    validateStreamWebhookRequest({
      body: { uid: "video-uid" },
      headers: { "x-webhook-secret": "secret" },
      secret: "secret",
    }),
    "video-uid",
  );

  assert.throws(
    () => validateStreamWebhookRequest({
      body: { uid: "video-uid" },
      headers: { "x-webhook-secret": "wrong" },
      secret: "secret",
    }),
    CloudflareStreamValidationError,
  );
});

test("Cloudflare Stream API routes require staff auth and persist media-assets and reels", () => {
  const uploadRoute = readProjectFile("src/pages/api/cloudflare/stream/direct-upload.js");
  const videoRoute = readProjectFile("src/pages/api/cloudflare/stream/[videoId].js");
  const webhookRoute = readProjectFile("src/pages/api/cloudflare/stream/webhook.js");
  const service = readProjectFile("src/lib/server/media-assets-service.js");

  assert.match(uploadRoute, /requireAnyRole\(req, \["journalist", "editor", "admin"\]\)/);
  assert.match(uploadRoute, /validateStreamDirectUploadInput/);
  assert.match(uploadRoute, /enforceRateLimit/);
  assert.match(uploadRoute, /createMediaAssetForStreamDirectUpload/);
  assert.doesNotMatch(uploadRoute, /CLOUDFLARE_STREAM_API_TOKEN/);

  assert.match(videoRoute, /updateMediaAssetFromCloudflareStream/);
  assert.match(videoRoute, /markMediaAssetStreamDeleted/);
  assert.match(webhookRoute, /CLOUDFLARE_STREAM_WEBHOOK_SECRET/);
  assert.match(webhookRoute, /validateStreamWebhookRequest/);

  assert.match(service, /provider:\s*"cloudflare_stream"/);
  assert.match(service, /collection:\s*REELS_COLLECTION/);
  assert.match(service, /status:\s*"archived"/);
});
