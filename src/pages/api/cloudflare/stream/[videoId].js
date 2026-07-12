import { deleteStream, getStreamDetails } from "@/lib/server/cloudflare-media";
import { AuthRequiredError, ForbiddenError, requireAnyRole } from "@/lib/server/auth-helpers";
import { validateVideoId } from "@/lib/server/cloudflare-stream-policy";
import {
  markMediaAssetStreamDeleted,
  updateMediaAssetFromCloudflareStream,
} from "@/lib/server/media-assets-service";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error instanceof ForbiddenError || error instanceof RateLimitError
    ? error.status
    : error?.status || 500;
  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }
  if (status >= 500) {
    console.error("[cloudflare-stream:video]", {
      message: error?.message,
      status,
      cloudflareErrors: error?.data?.errors,
    });
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

export default async function handler(req, res) {
  if (!["GET", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { session } = await requireAnyRole(req, ["journalist", "editor", "admin"]);
    await enforceRateLimit(req, res, {
      scope: "cloudflare-stream:video",
      userId: session.user.id,
      userLimit: 120,
      ipLimit: 240,
      windowMs: 10 * 60 * 1000,
    });
    const { videoId } = req.query;

    if (!videoId || Array.isArray(videoId)) {
      return res.status(400).json({ error: "Missing videoId." });
    }

    const cleanVideoId = validateVideoId(videoId);

    if (req.method === "DELETE") {
      await deleteStream(cleanVideoId);
      const result = await markMediaAssetStreamDeleted(cleanVideoId);
      return res.status(200).json({
        ok: true,
        cloudflareStreamUid: cleanVideoId,
        mediaAsset: result.mediaAsset,
        reels: result.reels,
        mediaAssetUpdated: result.updated,
      });
    }

    const cloudflareResponse = await getStreamDetails(cleanVideoId);
    const result = await updateMediaAssetFromCloudflareStream({
      videoId: cleanVideoId,
      cloudflareResponse,
    });

    return res.status(200).json({
      cloudflareStreamUid: result.video.cloudflareStreamUid || cleanVideoId,
      video: result.video,
      mediaAsset: result.mediaAsset,
      reels: result.reels,
      mediaAssetUpdated: result.updated,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
