import { createImageDirectUpload, getCloudflareImageUrl } from "@/lib/server/cloudflare-media";
import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { validateAvatarDirectUploadInput } from "@/lib/server/avatar-upload-policy";
import { logMediaUploadAttempt } from "@/lib/server/media-upload-audit";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

function sendError(req, res, error) {
  const status = error instanceof AuthRequiredError || error instanceof RateLimitError ? error.status : error?.status || 500;
  if (error instanceof RateLimitError) res.setHeader("Retry-After", String(error.retryAfterSeconds));
  if (status >= 500) console.error("[account-avatar:direct-upload]", { message: error?.message, phase: error?.phase, status });
  logMediaUploadAttempt(req, { route: "account-avatar:direct-upload", status: "failed", phase: error?.phase, statusCode: status });
  return res.status(status).json({
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
    const session = await requireAuth(req);
    phase = "validate";
    const input = validateAvatarDirectUploadInput(req.body || {});
    await enforceRateLimit(req, res, { scope: "account-avatar:direct-upload", userId: session.user.id, userLimit: 3, ipLimit: 8, windowMs: 10 * 60 * 1000 });
    logMediaUploadAttempt(req, { route: "account-avatar:direct-upload", status: "accepted", phase, user: session.user, fileMimeType: input.fileMimeType, fileSizeBytes: input.fileSizeBytes, statusCode: 201 });

    phase = "cloudflare-direct-upload";
    const cloudflareResponse = await createImageDirectUpload({
      metadata: { kind: "account_avatar", originalFilename: input.originalFilename, uploadedByAuthUserId: session.user.id },
      requireSignedURLs: false,
    });
    const uploadURL = cloudflareResponse?.result?.uploadURL || cloudflareResponse?.result?.uploadUrl || "";
    const avatarUrl = getCloudflareImageUrl(cloudflareResponse?.result?.id || "");
    if (!uploadURL || !avatarUrl) {
      const error = new Error("Cloudflare direct upload did not return required avatar metadata.");
      error.status = 502;
      throw error;
    }
    return res.status(201).json({ uploadURL, avatarUrl });
  } catch (error) {
    error.phase = error.phase || phase;
    return sendError(req, res, error);
  }
}
