import { validateStreamWebhookRequest } from "@/lib/server/cloudflare-stream-policy";
import { updateMediaAssetFromCloudflareStream } from "@/lib/server/media-assets-service";

function sendError(res, error) {
  const status = error?.status || 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET) {
      return res.status(503).json({
        error: "Cloudflare Stream webhook is not enabled.",
        code: "CLOUDFLARE_STREAM_WEBHOOK_DISABLED",
      });
    }

    const videoId = validateStreamWebhookRequest({
      body: req.body || {},
      headers: req.headers || {},
      secret: process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET || "",
    });
    const result = await updateMediaAssetFromCloudflareStream({
      videoId,
      cloudflareResponse: { result: req.body || {} },
    });

    return res.status(200).json({
      ok: true,
      cloudflareStreamUid: result.video.cloudflareStreamUid || videoId,
      mediaAssetUpdated: result.updated,
      reelsUpdated: result.reels?.length || 0,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
