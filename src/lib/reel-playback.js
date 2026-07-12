const CLOUDFLARE_STREAM_UID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;
const DIRECT_VIDEO_PATTERN = /\.(?:mp4|webm|ogg)(?:$|[?#])/i;

export function getCloudflareReelEmbedUrl(reel = {}) {
  const uid = String(reel?.cloudflareStreamUid || "").trim();
  if (!CLOUDFLARE_STREAM_UID_PATTERN.test(uid)) return "";

  return `https://iframe.videodelivery.net/${encodeURIComponent(uid)}?autoplay=true`;
}

export function getDirectReelVideoUrl(reel = {}) {
  const value = String(reel?.videoUrl || reel?.deliveryUrl || "").trim();
  if (!DIRECT_VIDEO_PATTERN.test(value)) return "";

  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}
