import { createImageDirectUpload, createStreamDirectUpload } from "../../lib/server/cloudflare-media.js";
import { validateImageDirectUploadInput } from "../../lib/server/cloudflare-images-policy.js";
import { validateStreamDirectUploadInput } from "../../lib/server/cloudflare-stream-policy.js";
import { createMediaAssetForImageDirectUpload, createMediaAssetForStreamDirectUpload } from "../../lib/server/media-assets-service.js";
import { hasPayloadRole } from "../access/roles.js";

const EDITORIAL_MEDIA_ROLES = ["journalist", "editor", "admin", "desk", "moderator"];

function response(body, status = 200) {
  return Response.json(body, { status });
}

export async function createPayloadMediaAssetDirectUpload(req) {
  if (!req.user) return response({ error: "Authentication required" }, 401);
  if (!hasPayloadRole(req.user, EDITORIAL_MEDIA_ROLES)) return response({ error: "Forbidden" }, 403);

  try {
    const input = validateImageDirectUploadInput(await req.json());
    const cloudflareResponse = await createImageDirectUpload({
      metadata: {
        title: input.title,
        alt: input.alt,
        caption: input.caption,
        credit: input.credit,
        usageRights: input.usageRights,
        originalFilename: input.originalFilename,
        uploadedByPayloadUserId: req.user.id,
      },
      requireSignedURLs: input.requireSignedURLs,
      expiry: input.expiry || undefined,
    });
    const uploadURL = cloudflareResponse?.result?.uploadURL || cloudflareResponse?.result?.uploadUrl || "";
    const cloudflareImageId = cloudflareResponse?.result?.id || "";
    if (!uploadURL || !cloudflareImageId) return response({ error: "Cloudflare did not return an upload URL" }, 502);

    const { mediaAsset } = await createMediaAssetForImageDirectUpload({ cloudflareResponse, input, user: req.user });
    return response({ uploadURL, cloudflareImageId, mediaAsset }, 201);
  } catch (error) {
    const status = error?.status || 500;
    if (status >= 500) {
      console.error("[payload-media-assets:cloudflare-direct-upload]", {
        message: error?.message,
        status,
        cloudflareErrors: error?.data?.errors,
      });
    }
    return response({
      error: status >= 500 ? "Internal server error" : error.message,
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.missing?.length ? { missing: error.missing } : {}),
    }, status);
  }
}

export async function createPayloadMediaAssetStreamDirectUpload(req) {
  if (!req.user) return response({ error: "Authentication required" }, 401);
  if (!hasPayloadRole(req.user, EDITORIAL_MEDIA_ROLES)) return response({ error: "Forbidden" }, 403);

  try {
    const input = validateStreamDirectUploadInput(await req.json());
    const cloudflareResponse = await createStreamDirectUpload({
      maxDurationSeconds: input.maxDurationSeconds,
      expiry: input.expiry || undefined,
      requireSignedURLs: input.requireSignedURLs,
      thumbnailTimestampPct: input.thumbnailTimestampPct,
      creator: String(req.user.id),
      meta: {
        title: input.title,
        description: input.description,
        originalFilename: input.originalFilename,
        uploadedByPayloadUserId: req.user.id,
      },
    });
    const uploadURL = cloudflareResponse?.result?.uploadURL || cloudflareResponse?.result?.uploadUrl || "";
    const cloudflareStreamUid = cloudflareResponse?.result?.uid || cloudflareResponse?.result?.id || "";
    if (!uploadURL || !cloudflareStreamUid) return response({ error: "Cloudflare did not return an upload URL" }, 502);

    const { mediaAsset } = await createMediaAssetForStreamDirectUpload({ cloudflareResponse, input, user: req.user });
    return response({ uploadURL, cloudflareStreamUid, mediaAsset }, 201);
  } catch (error) {
    const status = error?.status || 500;
    if (status >= 500) {
      console.error("[payload-media-assets:cloudflare-stream-direct-upload]", {
        message: error?.message,
        status,
        cloudflareErrors: error?.data?.errors,
      });
    }
    return response({
      error: status >= 500 ? "Internal server error" : error.message,
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.missing?.length ? { missing: error.missing } : {}),
    }, status);
  }
}
