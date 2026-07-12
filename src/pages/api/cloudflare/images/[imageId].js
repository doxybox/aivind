import { deleteImage, getImageDetails } from "@/lib/server/cloudflare-media";
import { AuthRequiredError, ForbiddenError, requireAnyRole } from "@/lib/server/auth-helpers";
import { validateImageId } from "@/lib/server/cloudflare-images-policy";
import {
  markMediaAssetImageDeleted,
  updateMediaAssetFromCloudflareImage,
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
    console.error("[cloudflare-images:image]", {
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
      scope: "cloudflare-images:image",
      userId: session.user.id,
      userLimit: 120,
      ipLimit: 240,
      windowMs: 10 * 60 * 1000,
    });
    const { imageId } = req.query;

    if (!imageId || Array.isArray(imageId)) {
      return res.status(400).json({ error: "Missing imageId." });
    }

    const cleanImageId = validateImageId(imageId);

    if (req.method === "DELETE") {
      await deleteImage(cleanImageId);
      const result = await markMediaAssetImageDeleted(cleanImageId);
      return res.status(200).json({
        ok: true,
        cloudflareImageId: cleanImageId,
        mediaAsset: result.mediaAsset,
        mediaAssetUpdated: result.updated,
      });
    }

    const cloudflareResponse = await getImageDetails(cleanImageId);
    const result = await updateMediaAssetFromCloudflareImage({
      imageId: cleanImageId,
      cloudflareResponse,
    });

    return res.status(200).json({
      cloudflareImageId: result.image.cloudflareImageId || cleanImageId,
      image: result.image,
      mediaAsset: result.mediaAsset,
      mediaAssetUpdated: result.updated,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
