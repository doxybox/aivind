import { getCloudflareImageUrl } from "./cloudflare-media.js";
import { getPayloadClient } from "./payload-client.js";

const MEDIA_COLLECTION = "media-assets";
const REELS_COLLECTION = "reels";

function resultOf(cloudflareResponse = {}) {
  return cloudflareResponse?.result || {};
}

function firstString(values = []) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function numberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function stateToMediaStatus(state = "", fallback = "processing") {
  const normalized = String(state || "").toLowerCase();
  if (["ready", "published"].includes(normalized)) return "ready";
  if (["error", "failed"].includes(normalized)) return "failed";
  if (["queued", "pendingupload", "uploading"].includes(normalized)) return "uploading";
  return fallback;
}

export function normalizeCloudflareImage(cloudflareResponse = {}) {
  const result = resultOf(cloudflareResponse);
  const imageId = result.id || "";
  const variants = Array.isArray(result.variants) ? result.variants.filter(Boolean) : [];
  const deliveryUrl = firstString([
    result.deliveryUrl,
    result.url,
    variants[0],
    getCloudflareImageUrl(imageId),
  ]);
  const uploaded = Boolean(result.uploaded) || Boolean(result.uploadedAt);
  const draft = result.draft === true;

  return {
    cloudflareImageId: imageId,
    deliveryUrl,
    thumbnailUrl: firstString([result.thumbnailUrl, result.thumbnail, variants[0], deliveryUrl]),
    width: numberOrUndefined(result.width || result.meta?.width),
    height: numberOrUndefined(result.height || result.meta?.height),
    variants,
    status: uploaded && !draft ? "ready" : "uploading",
    originalFilename: result.filename || result.meta?.originalFilename || "",
    rawStatus: {
      uploaded,
      draft,
      requireSignedURLs: result.requireSignedURLs,
    },
  };
}

export function serializeMediaAsset(mediaAsset = null) {
  if (!mediaAsset) return null;

  return {
    id: mediaAsset.id,
    title: mediaAsset.title || "",
    type: mediaAsset.type || "",
    provider: mediaAsset.provider || "",
    status: mediaAsset.status || "",
    cloudflareImageId: mediaAsset.cloudflareImageId || "",
    cloudflareStreamUid: mediaAsset.cloudflareStreamUid || "",
    deliveryUrl: mediaAsset.deliveryUrl || "",
    thumbnailUrl: mediaAsset.thumbnailUrl || "",
    originalFilename: mediaAsset.originalFilename || "",
    width: mediaAsset.width || null,
    height: mediaAsset.height || null,
    duration: mediaAsset.duration || null,
    alt: mediaAsset.alt || "",
    caption: mediaAsset.caption || "",
    credit: mediaAsset.credit || "",
    usageRights: mediaAsset.usageRights || "",
  };
}

export function normalizeCloudflareStream(cloudflareResponse = {}) {
  const result = resultOf(cloudflareResponse);
  const uid = result.uid || result.id || "";
  const state = result.status?.state || result.state || "";
  const playback = result.playback || {};
  const deliveryUrl = firstString([
    playback.hls,
    playback.dash,
    result.preview,
    uid ? `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID || ""}.cloudflarestream.com/${uid}/manifest/video.m3u8` : "",
  ]);
  const thumbnailUrl = firstString([
    result.thumbnail,
    result.thumbnailUrl,
    uid ? `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID || ""}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg` : "",
  ]);
  const readyToStream = result.readyToStream === true || result.status?.state === "ready";

  return {
    cloudflareStreamUid: uid,
    deliveryUrl,
    thumbnailUrl,
    width: numberOrUndefined(result.input?.width || result.width),
    height: numberOrUndefined(result.input?.height || result.height),
    duration: numberOrUndefined(result.duration),
    status: readyToStream ? "ready" : stateToMediaStatus(state),
    originalFilename: result.meta?.originalFilename || result.meta?.filename || "",
    rawStatus: {
      state,
      readyToStream,
      pctComplete: result.status?.pctComplete,
      errorReason: result.status?.errorReason,
      requireSignedURLs: result.requireSignedURLs,
    },
  };
}

async function findPayloadUserId(user = {}) {
  if (!user?.email) return undefined;

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "payload-users",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        email: {
          equals: user.email,
        },
      },
    });

    return result.docs?.[0]?.id;
  } catch (error) {
    console.error("[media-assets:findPayloadUserId]", error?.message || error);
    return undefined;
  }
}

function buildMediaAssetData({ input = {}, image = {}, user = {}, status = "uploading" } = {}) {
  return {
    title: input.title || input.originalFilename || image.originalFilename || "Cloudflare image",
    provider: "cloudflare_images",
    type: "image",
    cloudflareImageId: image.cloudflareImageId || "",
    deliveryUrl: image.deliveryUrl || "",
    thumbnailUrl: image.thumbnailUrl || "",
    originalFilename: input.originalFilename || image.originalFilename || "",
    width: image.width,
    height: image.height,
    alt: input.alt || "",
    caption: input.caption || "",
    credit: input.credit || "",
    usageRights: input.usageRights || "",
    status,
    metadata: {
      cloudflare: {
        variants: image.variants || [],
        rawStatus: image.rawStatus || {},
      },
      uploadedByAuthUserId: user?.id || "",
      uploadedByEmail: user?.email || "",
    },
  };
}

function buildStreamMediaAssetData({ input = {}, video = {}, user = {}, status = "uploading" } = {}) {
  return {
    title: input.title || input.originalFilename || video.originalFilename || "Cloudflare video",
    provider: "cloudflare_stream",
    type: "video",
    cloudflareStreamUid: video.cloudflareStreamUid || "",
    deliveryUrl: video.deliveryUrl || "",
    thumbnailUrl: video.thumbnailUrl || "",
    originalFilename: input.originalFilename || video.originalFilename || "",
    width: video.width,
    height: video.height,
    duration: video.duration,
    caption: input.description || "",
    status,
    metadata: {
      cloudflare: {
        rawStatus: video.rawStatus || {},
      },
      description: input.description || "",
      uploadedByAuthUserId: user?.id || "",
      uploadedByEmail: user?.email || "",
    },
  };
}

export function serializeReel(reel = null) {
  if (!reel) return null;

  return {
    id: reel.id,
    title: reel.title || "",
    slug: reel.slug || "",
    status: reel.status || "",
    isActive: Boolean(reel.isActive),
    cloudflareStreamUid: reel.cloudflareStreamUid || "",
    description: reel.description || "",
    mediaAsset: typeof reel.mediaAsset === "object" ? reel.mediaAsset?.id : reel.mediaAsset,
  };
}

export async function createMediaAssetForImageDirectUpload({ cloudflareResponse, input, user }) {
  const image = normalizeCloudflareImage(cloudflareResponse);
  const uploadedBy = await findPayloadUserId(user);
  const payload = await getPayloadClient();
  const data = buildMediaAssetData({ input, image, user, status: "uploading" });

  if (uploadedBy) {
    data.uploadedBy = uploadedBy;
  }

  const mediaAsset = await payload.create({
    collection: MEDIA_COLLECTION,
    data,
    overrideAccess: true,
  });

  return {
    image,
    mediaAsset: serializeMediaAsset(mediaAsset),
  };
}

export async function createMediaAssetForStreamDirectUpload({ cloudflareResponse, input, user }) {
  const video = normalizeCloudflareStream(cloudflareResponse);
  const uploadedBy = await findPayloadUserId(user);
  const payload = await getPayloadClient();
  const data = buildStreamMediaAssetData({ input, video, user, status: "uploading" });

  if (uploadedBy) {
    data.uploadedBy = uploadedBy;
  }

  const mediaAsset = await payload.create({
    collection: MEDIA_COLLECTION,
    data,
    overrideAccess: true,
  });

  let reel = null;
  if (input.createReel) {
    reel = await payload.create({
      collection: REELS_COLLECTION,
      overrideAccess: true,
      data: {
        title: input.title || data.title,
        slug: input.reelSlug,
        status: "draft",
        mediaAsset: mediaAsset.id,
        cloudflareStreamUid: video.cloudflareStreamUid,
        description: input.description || "",
        isActive: false,
      },
    });
  }

  return {
    video,
    mediaAsset: serializeMediaAsset(mediaAsset),
    reel: serializeReel(reel),
  };
}

export async function findMediaAssetByCloudflareImageId(imageId) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: MEDIA_COLLECTION,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      cloudflareImageId: {
        equals: imageId,
      },
    },
  });

  return result.docs?.[0] || null;
}

export async function findMediaAssetByCloudflareStreamUid(videoId) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: MEDIA_COLLECTION,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      cloudflareStreamUid: {
        equals: videoId,
      },
    },
  });

  return result.docs?.[0] || null;
}

async function findReelsByCloudflareStreamUid(videoId) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: REELS_COLLECTION,
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: {
      cloudflareStreamUid: {
        equals: videoId,
      },
    },
  });

  return result.docs || [];
}

async function updateLinkedReelsForStream(videoId, mediaStatus) {
  const reels = await findReelsByCloudflareStreamUid(videoId);
  if (reels.length === 0) return [];

  const payload = await getPayloadClient();
  const reelStatus = mediaStatus === "failed" ? "archived" : null;
  const updates = await Promise.all(
    reels.map((reel) => payload.update({
      collection: REELS_COLLECTION,
      id: reel.id,
      overrideAccess: true,
      data: {
        ...(reelStatus ? { status: "archived", isActive: false } : {}),
        cloudflareStreamUid: videoId,
      },
    })),
  );

  return updates.map(serializeReel);
}

export async function updateMediaAssetFromCloudflareImage({ imageId, cloudflareResponse }) {
  const existing = await findMediaAssetByCloudflareImageId(imageId);
  const image = normalizeCloudflareImage(cloudflareResponse);

  if (!existing) {
    return {
      image,
      mediaAsset: null,
      updated: false,
    };
  }

  const payload = await getPayloadClient();
  const mediaAsset = await payload.update({
    collection: MEDIA_COLLECTION,
    id: existing.id,
    overrideAccess: true,
    data: {
      cloudflareImageId: image.cloudflareImageId || imageId,
      deliveryUrl: image.deliveryUrl || existing.deliveryUrl || "",
      thumbnailUrl: image.thumbnailUrl || existing.thumbnailUrl || "",
      width: image.width || existing.width,
      height: image.height || existing.height,
      originalFilename: existing.originalFilename || image.originalFilename || "",
      status: image.status,
      metadata: {
        ...(existing.metadata || {}),
        cloudflare: {
          variants: image.variants || [],
          rawStatus: image.rawStatus || {},
        },
      },
    },
  });

  return {
    image,
    mediaAsset: serializeMediaAsset(mediaAsset),
    updated: true,
  };
}

export async function updateMediaAssetFromCloudflareStream({ videoId, cloudflareResponse }) {
  const existing = await findMediaAssetByCloudflareStreamUid(videoId);
  const video = normalizeCloudflareStream(cloudflareResponse);

  if (!existing) {
    return {
      video,
      mediaAsset: null,
      reels: [],
      updated: false,
    };
  }

  const payload = await getPayloadClient();
  const mediaAsset = await payload.update({
    collection: MEDIA_COLLECTION,
    id: existing.id,
    overrideAccess: true,
    data: {
      cloudflareStreamUid: video.cloudflareStreamUid || videoId,
      deliveryUrl: video.deliveryUrl || existing.deliveryUrl || "",
      thumbnailUrl: video.thumbnailUrl || existing.thumbnailUrl || "",
      width: video.width || existing.width,
      height: video.height || existing.height,
      duration: video.duration || existing.duration,
      originalFilename: existing.originalFilename || video.originalFilename || "",
      status: video.status,
      metadata: {
        ...(existing.metadata || {}),
        cloudflare: {
          rawStatus: video.rawStatus || {},
        },
      },
    },
  });
  const reels = await updateLinkedReelsForStream(video.cloudflareStreamUid || videoId, video.status);

  return {
    video,
    mediaAsset: serializeMediaAsset(mediaAsset),
    reels,
    updated: true,
  };
}

export async function markMediaAssetImageDeleted(imageId) {
  const existing = await findMediaAssetByCloudflareImageId(imageId);
  if (!existing) {
    return {
      mediaAsset: null,
      updated: false,
    };
  }

  const payload = await getPayloadClient();
  const mediaAsset = await payload.update({
    collection: MEDIA_COLLECTION,
    id: existing.id,
    overrideAccess: true,
    data: {
      status: "failed",
      metadata: {
        ...(existing.metadata || {}),
        cloudflare: {
          ...(existing.metadata?.cloudflare || {}),
          deletedAt: new Date().toISOString(),
        },
      },
    },
  });

  return {
    mediaAsset: serializeMediaAsset(mediaAsset),
    updated: true,
  };
}

export async function markMediaAssetStreamDeleted(videoId) {
  const existing = await findMediaAssetByCloudflareStreamUid(videoId);
  if (!existing) {
    return {
      mediaAsset: null,
      reels: [],
      updated: false,
    };
  }

  const payload = await getPayloadClient();
  const mediaAsset = await payload.update({
    collection: MEDIA_COLLECTION,
    id: existing.id,
    overrideAccess: true,
    data: {
      status: "failed",
      metadata: {
        ...(existing.metadata || {}),
        cloudflare: {
          ...(existing.metadata?.cloudflare || {}),
          deletedAt: new Date().toISOString(),
        },
      },
    },
  });
  const reels = await updateLinkedReelsForStream(videoId, "failed");

  return {
    mediaAsset: serializeMediaAsset(mediaAsset),
    reels,
    updated: true,
  };
}
