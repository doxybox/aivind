const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{1,180}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_STREAM_UPLOAD_BYTES = 500 * 1024 * 1024;
const ALLOWED_STREAM_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const STREAM_UPLOAD_LIMITS = {
  maxBytes: MAX_STREAM_UPLOAD_BYTES,
  allowedMimeTypes: [...ALLOWED_STREAM_MIME_TYPES],
};

const FIELD_LIMITS = {
  title: 160,
  description: 1000,
  originalFilename: 240,
  reelSlug: 160,
  expiry: 80,
  fileMimeType: 80,
};

const ALLOWED_UPLOAD_FIELDS = new Set([
  ...Object.keys(FIELD_LIMITS),
  "fileSizeBytes",
  "requireSignedUrl",
  "requireSignedURLs",
  "createReel",
  "maxDurationSeconds",
  "thumbnailTimestampPct",
]);

const FORBIDDEN_USER_KEYS = ["userId", "user_id", "ownerId", "owner_id", "uploadedBy"];

export class CloudflareStreamValidationError extends Error {
  constructor(message = "Invalid Cloudflare Stream request") {
    super(message);
    this.name = "CloudflareStreamValidationError";
    this.status = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanOptionalString(input, key, maxLength) {
  if (input[key] === undefined || input[key] === null || input[key] === "") return "";
  if (typeof input[key] !== "string") {
    throw new CloudflareStreamValidationError(`${key} must be a string`);
  }

  const value = input[key].trim();
  if (value.length > maxLength) {
    throw new CloudflareStreamValidationError(`${key} is too long`);
  }

  return value;
}

function cleanOptionalNumber(input, key, min, max) {
  if (input[key] === undefined || input[key] === null || input[key] === "") return undefined;
  const value = Number(input[key]);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new CloudflareStreamValidationError(`${key} is invalid`);
  }
  return value;
}

function cleanStreamFileMetadata(input) {
  const fileMimeType = cleanOptionalString(input, "fileMimeType", FIELD_LIMITS.fileMimeType).toLowerCase();
  const fileSizeBytes = cleanOptionalNumber(input, "fileSizeBytes", 1, MAX_STREAM_UPLOAD_BYTES);

  if (!fileMimeType) {
    throw new CloudflareStreamValidationError("fileMimeType is required");
  }

  if (fileMimeType && !ALLOWED_STREAM_MIME_TYPES.has(fileMimeType)) {
    throw new CloudflareStreamValidationError("Unsupported video file type");
  }

  if (fileSizeBytes === undefined) {
    throw new CloudflareStreamValidationError("fileSizeBytes is required");
  }

  return {
    fileMimeType,
    fileSizeBytes,
  };
}

function assertAllowedKeys(input) {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_USER_KEYS.includes(key)) {
      throw new CloudflareStreamValidationError("Do not send userId for stream uploads");
    }

    if (!ALLOWED_UPLOAD_FIELDS.has(key)) {
      throw new CloudflareStreamValidationError(`Invalid stream upload field: ${key}`);
    }
  }
}

export function slugifyReelTitle(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function validateVideoId(value) {
  const videoId = typeof value === "string" ? value.trim() : "";
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    throw new CloudflareStreamValidationError("Invalid videoId");
  }
  return videoId;
}

export function validateStreamDirectUploadInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new CloudflareStreamValidationError("Invalid stream upload payload");
  }

  assertAllowedKeys(input);

  const clean = {};
  for (const [key, maxLength] of Object.entries(FIELD_LIMITS)) {
    clean[key] = cleanOptionalString(input, key, maxLength);
  }

  if (input.createReel !== undefined && typeof input.createReel !== "boolean") {
    throw new CloudflareStreamValidationError("createReel must be a boolean");
  }

  if (input.requireSignedUrl !== undefined && typeof input.requireSignedUrl !== "boolean") {
    throw new CloudflareStreamValidationError("requireSignedUrl must be a boolean");
  }

  if (input.requireSignedURLs !== undefined && typeof input.requireSignedURLs !== "boolean") {
    throw new CloudflareStreamValidationError("requireSignedURLs must be a boolean");
  }

  const fileMetadata = cleanStreamFileMetadata(input);

  clean.createReel = input.createReel === true;
  clean.requireSignedURLs = input.requireSignedURLs === true || input.requireSignedUrl === true;
  clean.maxDurationSeconds = cleanOptionalNumber(input, "maxDurationSeconds", 1, 21600);
  clean.thumbnailTimestampPct = cleanOptionalNumber(input, "thumbnailTimestampPct", 0, 1);
  clean.fileMimeType = fileMetadata.fileMimeType;
  clean.fileSizeBytes = fileMetadata.fileSizeBytes;

  if (clean.reelSlug && !SLUG_PATTERN.test(clean.reelSlug)) {
    throw new CloudflareStreamValidationError("reelSlug is invalid");
  }

  if (clean.createReel && !clean.reelSlug) {
    clean.reelSlug = slugifyReelTitle(clean.title || clean.originalFilename || "reel");
  }

  return clean;
}

export function validateStreamWebhookRequest({ body = {}, headers = {}, secret = "" } = {}) {
  if (!isPlainObject(body)) {
    throw new CloudflareStreamValidationError("Invalid stream webhook payload");
  }

  if (secret) {
    const provided =
      headers["x-cloudflare-stream-webhook-secret"] ||
      headers["x-webhook-secret"] ||
      String(headers.authorization || "").replace(/^Bearer\s+/i, "");

    if (provided !== secret) {
      const error = new CloudflareStreamValidationError("Invalid webhook secret");
      error.status = 401;
      throw error;
    }
  }

  const videoId = body.uid || body.videoId || body.video?.uid || body.result?.uid;
  return validateVideoId(videoId);
}
