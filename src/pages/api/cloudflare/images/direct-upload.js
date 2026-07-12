import { createImageDirectUpload } from "@/lib/server/cloudflare-media";
import { AuthRequiredError, ForbiddenError, requireAnyRole } from "@/lib/server/auth-helpers";
import { validateImageDirectUploadInput } from "@/lib/server/cloudflare-images-policy";
import { logMediaUploadAttempt } from "@/lib/server/media-upload-audit";
import { createMediaAssetForImageDirectUpload } from "@/lib/server/media-assets-service";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

function sendError(req, res, error) {
  const status = error instanceof AuthRequiredError || error instanceof ForbiddenError || error instanceof RateLimitError
    ? error.status
    : error?.status || 500;
  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }
  if (status >= 500) {
    console.error("[cloudflare-images:direct-upload]", {
      message: error?.message,
      phase: error?.phase,
      status,
      cloudflareErrors: error?.data?.errors,
    });
  }
  logMediaUploadAttempt(req, {
    route: "cloudflare-images:direct-upload",
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
    const { session } = await requireAnyRole(req, ["journalist", "editor", "admin"]);
    phase = "validate";
    const input = validateImageDirectUploadInput(req.body || {});
    await enforceRateLimit(req, res, {
      scope: "cloudflare-images:direct-upload",
      userId: session.user.id,
      userLimit: 12,
      ipLimit: 30,
      windowMs: 10 * 60 * 1000,
    });
    logMediaUploadAttempt(req, {
      route: "cloudflare-images:direct-upload",
      status: "accepted",
      phase,
      user: session.user,
      fileMimeType: input.fileMimeType,
      fileSizeBytes: input.fileSizeBytes,
      statusCode: 201,
    });
    phase = "cloudflare-direct-upload";
    const cloudflareResponse = await createImageDirectUpload({
      metadata: {
        title: input.title,
        alt: input.alt,
        caption: input.caption,
        credit: input.credit,
        usageRights: input.usageRights,
        originalFilename: input.originalFilename,
        uploadedByAuthUserId: session.user.id,
      },
      requireSignedURLs: input.requireSignedURLs,
      expiry: input.expiry || undefined,
    });
    const uploadURL = cloudflareResponse?.result?.uploadURL || cloudflareResponse?.result?.uploadUrl || "";
    const cloudflareImageId = cloudflareResponse?.result?.id || "";
    if (!uploadURL || !cloudflareImageId) {
      const error = new Error("Cloudflare direct upload did not return required image metadata.");
      error.status = 502;
      throw error;
    }

    phase = "payload-media-asset-create";
    const { image, mediaAsset } = await createMediaAssetForImageDirectUpload({
      cloudflareResponse,
      input,
      user: session.user,
    });

    return res.status(201).json({
      uploadURL,
      cloudflareImageId: image.cloudflareImageId || cloudflareImageId,
      mediaAsset,
    });
  } catch (error) {
    error.phase = error.phase || phase;
    return sendError(req, res, error);
  }
}
