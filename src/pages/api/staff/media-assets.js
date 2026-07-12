import { AuthRequiredError, ForbiddenError, requireAnyRole } from "@/lib/server/auth-helpers";
import { getPayloadClient } from "@/lib/server/payload-client";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

const ALLOWED_TYPES = new Set(["image", "video", "file"]);
const ALLOWED_STATUSES = new Set(["draft", "uploading", "processing", "ready", "failed"]);

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error instanceof ForbiddenError || error instanceof RateLimitError
    ? error.status
    : error?.status || 500;
  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

function cleanLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(Math.max(Math.floor(parsed), 1), 50);
}

function serializeMediaAsset(asset = {}) {
  return {
    id: asset.id,
    title: asset.title || "",
    type: asset.type || "",
    provider: asset.provider || "",
    status: asset.status || "",
    deliveryUrl: asset.deliveryUrl || "",
    thumbnailUrl: asset.thumbnailUrl || "",
    cloudflareImageId: asset.cloudflareImageId || "",
    cloudflareStreamUid: asset.cloudflareStreamUid || "",
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null,
  };
}

function buildWhere(query = {}) {
  const clauses = [];
  const type = typeof query.type === "string" ? query.type : "";
  const status = typeof query.status === "string" ? query.status : "";

  if (type && ALLOWED_TYPES.has(type)) {
    clauses.push({ type: { equals: type } });
  }

  if (status && ALLOWED_STATUSES.has(status)) {
    clauses.push({ status: { equals: status } });
  }

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { and: clauses };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { session } = await requireAnyRole(req, ["journalist", "editor", "admin"]);
    await enforceRateLimit(req, res, {
      scope: "staff:media-assets",
      userId: session.user.id,
      userLimit: 120,
      ipLimit: 240,
      windowMs: 10 * 60 * 1000,
    });
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "media-assets",
      depth: 0,
      limit: cleanLimit(req.query.limit),
      sort: "-createdAt",
      overrideAccess: true,
      where: buildWhere(req.query),
    });

    return res.status(200).json({
      mediaAssets: (result.docs || []).map(serializeMediaAsset),
      totalDocs: result.totalDocs || 0,
      limit: result.limit || cleanLimit(req.query.limit),
      page: result.page || 1,
      totalPages: result.totalPages || 1,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
