import { createStreamDirectUpload } from "@/lib/server/cloudflare-media";
import { AuthRequiredError, ForbiddenError, requireAnyRole } from "@/lib/server/auth-helpers";
import { validateStreamDirectUploadInput } from "@/lib/server/cloudflare-stream-policy";
import { logMediaUploadAttempt } from "@/lib/server/media-upload-audit";
import { createMediaAssetForStreamDirectUpload } from "@/lib/server/media-assets-service";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function sendError(req, res, error) {
  const status = error instanceof AuthRequiredError || error instanceof ForbiddenError || error instanceof RateLimitError
    ? error.status
    : error?.status || 500;
  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }
  if (status >= 500) {
    console.error("[cloudflare-stream:direct-upload]", {
      message: error?.message,
      phase: error?.phase,
      status,
      cloudflareErrors: error?.data?.errors,
    });
  }
  logMediaUploadAttempt(req, {
    route: "cloudflare-stream:direct-upload",
    status: "failed",
    phase: error?.phase,
    statusCode: status,
  });
  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
    ...(error?.code ? { code: error.code } : {}),
    ...(error?.missing?.length ? { missing: error.missing } : {}),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let phase = "auth";
  try {
    assertSameOriginRequest(req);
    const { session } = await requireAnyRole(req, ["journalist", "editor", "admin"]);
    phase = "validate";
    const input = validateStreamDirectUploadInput(req.body || {});
    await enforceRateLimit(req, res, {
      scope: "cloudflare-stream:direct-upload",
      userId: session.user.id,
      userLimit: 8,
      ipLimit: 20,
      windowMs: 10 * 60 * 1000,
    });
    logMediaUploadAttempt(req, {
      route: "cloudflare-stream:direct-upload",
      status: "accepted",
      phase,
      user: session.user,
      fileMimeType: input.fileMimeType,
      fileSizeBytes: input.fileSizeBytes,
      statusCode: 201,
    });
    phase = "cloudflare-direct-upload";
    const cloudflareResponse = await createStreamDirectUpload({
      maxDurationSeconds: input.maxDurationSeconds,
      expiry: input.expiry || undefined,
      requireSignedURLs: input.requireSignedURLs,
      thumbnailTimestampPct: input.thumbnailTimestampPct,
      creator: session.user.id,
      meta: {
        title: input.title,
        description: input.description,
        originalFilename: input.originalFilename,
        uploadedByAuthUserId: session.user.id,
      },
    });
    const uploadURL = cloudflareResponse?.result?.uploadURL || cloudflareResponse?.result?.uploadUrl || "";
    const cloudflareStreamUid = cloudflareResponse?.result?.uid || cloudflareResponse?.result?.id || "";
    if (!uploadURL || !cloudflareStreamUid) {
      const error = new Error("Cloudflare Stream direct upload did not return required video metadata.");
      error.status = 502;
      throw error;
    }

    phase = "payload-media-asset-create";
    const { video, mediaAsset, reel } = await createMediaAssetForStreamDirectUpload({
      cloudflareResponse,
      input,
      user: session.user,
    });

    return res.status(201).json({
      uploadURL,
      cloudflareStreamUid: video.cloudflareStreamUid || cloudflareStreamUid,
      mediaAsset,
      reel,
    });
  } catch (error) {
    error.phase = error.phase || phase;
    return sendError(req, res, error);
  }
}
