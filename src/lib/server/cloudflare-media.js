const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

export function getCloudflareMediaStatus(kind = "generic", env = process.env) {
  const enabled = env.CLOUDFLARE_MEDIA_ENABLED === "true";
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = kind === "images"
    ? env.CLOUDFLARE_IMAGES_API_TOKEN || env.CLOUDFLARE_API_TOKEN
    : kind === "stream"
      ? env.CLOUDFLARE_STREAM_API_TOKEN || env.CLOUDFLARE_API_TOKEN
      : env.CLOUDFLARE_API_TOKEN;
  const accountHash = kind === "images" ? env.CLOUDFLARE_IMAGES_ACCOUNT_HASH : "not-required";
  const missing = [
    enabled ? "" : "CLOUDFLARE_MEDIA_ENABLED=true",
    accountId ? "" : "CLOUDFLARE_ACCOUNT_ID",
    apiToken ? "" : kind === "images" ? "CLOUDFLARE_IMAGES_API_TOKEN" : "CLOUDFLARE_STREAM_API_TOKEN",
    accountHash ? "" : "CLOUDFLARE_IMAGES_ACCOUNT_HASH",
  ].filter(Boolean);

  return {
    enabled: enabled && missing.length === 0,
    kind,
    missing,
    message: missing.length
      ? "Cloudflare mediaopplasting er parkert eller mangler konfigurasjon."
      : "Cloudflare mediaopplasting er aktivert.",
  };
}

function requireCloudflareConfig(kind = "generic") {
  const status = getCloudflareMediaStatus(kind);
  if (!status.enabled) {
    const error = new Error(status.message);
    error.status = 503;
    error.code = "CLOUDFLARE_MEDIA_DISABLED";
    error.missing = status.missing;
    throw error;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = kind === "images"
    ? process.env.CLOUDFLARE_IMAGES_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
    : kind === "stream"
      ? process.env.CLOUDFLARE_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
      : process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    const error = new Error("Missing Cloudflare media configuration.");
    error.status = 500;
    throw error;
  }

  return { accountId, apiToken };
}

function appendFormValue(form, key, value) {
  if (value === undefined || value === null || value === "") return;
  form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
}

async function cloudflareRequest(path, { method = "GET", body, kind } = {}) {
  const { accountId, apiToken } = requireCloudflareConfig(kind);
  const response = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    const error = new Error(data?.errors?.[0]?.message || "Cloudflare API request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getCloudflareImageUrl(imageId, variant = process.env.CLOUDFLARE_IMAGES_DEFAULT_VARIANT || "public") {
  const accountHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
  if (!accountHash || !imageId) return "";
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

export async function createImageDirectUpload({ metadata, requireSignedURLs = false, expiry } = {}) {
  const form = new FormData();
  appendFormValue(form, "metadata", metadata);
  appendFormValue(form, "requireSignedURLs", requireSignedURLs);
  appendFormValue(form, "expiry", expiry);

  return cloudflareRequest("/images/v2/direct_upload", {
    method: "POST",
    body: form,
    kind: "images",
  });
}

export async function getImageDetails(imageId) {
  return cloudflareRequest(`/images/v1/${encodeURIComponent(imageId)}`, { kind: "images" });
}

export async function deleteImage(imageId) {
  return cloudflareRequest(`/images/v1/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
    kind: "images",
  });
}

export async function createStreamDirectUpload({
  maxDurationSeconds,
  expiry,
  allowedOrigins,
  requireSignedURLs = false,
  creator,
  thumbnailTimestampPct,
  meta,
} = {}) {
  const form = new FormData();
  appendFormValue(form, "maxDurationSeconds", maxDurationSeconds);
  appendFormValue(form, "expiry", expiry);
  appendFormValue(form, "allowedOrigins", allowedOrigins);
  appendFormValue(form, "requireSignedURLs", requireSignedURLs);
  appendFormValue(form, "creator", creator);
  appendFormValue(form, "thumbnailTimestampPct", thumbnailTimestampPct);
  appendFormValue(form, "meta", meta);

  return cloudflareRequest("/stream/direct_upload", {
    method: "POST",
    body: form,
    kind: "stream",
  });
}

export async function getStreamDetails(videoId) {
  return cloudflareRequest(`/stream/${encodeURIComponent(videoId)}`, { kind: "stream" });
}

export async function deleteStream(videoId) {
  return cloudflareRequest(`/stream/${encodeURIComponent(videoId)}`, {
    method: "DELETE",
    kind: "stream",
  });
}
