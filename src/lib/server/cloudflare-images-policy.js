const IMAGE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,160}$/;
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const IMAGE_UPLOAD_LIMITS = {
  maxBytes: MAX_IMAGE_UPLOAD_BYTES,
  allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
};

const FIELD_LIMITS = {
  title: 160,
  alt: 240,
  caption: 1000,
  credit: 160,
  usageRights: 1000,
  originalFilename: 240,
  fileMimeType: 80,
};

const ALLOWED_UPLOAD_FIELDS = new Set([
  ...Object.keys(FIELD_LIMITS),
  "fileSizeBytes",
  "requireSignedURLs",
  "expiry",
]);

const FORBIDDEN_USER_KEYS = ["userId", "user_id", "ownerId", "owner_id", "uploadedBy"];

export class CloudflareImagesValidationError extends Error {
  constructor(message = "Invalid Cloudflare Images request") {
    super(message);
    this.name = "CloudflareImagesValidationError";
    this.status = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanOptionalString(input, key, maxLength) {
  if (input[key] === undefined || input[key] === null || input[key] === "") return "";
  if (typeof input[key] !== "string") {
    throw new CloudflareImagesValidationError(`${key} must be a string`);
  }

  const value = input[key].trim();
  if (value.length > maxLength) {
    throw new CloudflareImagesValidationError(`${key} is too long`);
  }

  return value;
}

function cleanOptionalNumber(input, key, min, max) {
  if (input[key] === undefined || input[key] === null || input[key] === "") return undefined;
  const value = Number(input[key]);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new CloudflareImagesValidationError(`${key} is invalid`);
  }
  return value;
}

function cleanImageFileMetadata(input) {
  const fileMimeType = cleanOptionalString(input, "fileMimeType", FIELD_LIMITS.fileMimeType).toLowerCase();
  const fileSizeBytes = cleanOptionalNumber(input, "fileSizeBytes", 1, MAX_IMAGE_UPLOAD_BYTES);

  if (!fileMimeType) {
    throw new CloudflareImagesValidationError("fileMimeType is required");
  }

  if (fileMimeType && !ALLOWED_IMAGE_MIME_TYPES.has(fileMimeType)) {
    throw new CloudflareImagesValidationError("Unsupported image file type");
  }

  if (fileSizeBytes === undefined) {
    throw new CloudflareImagesValidationError("fileSizeBytes is required");
  }

  return {
    fileMimeType,
    fileSizeBytes,
  };
}

function assertAllowedKeys(input) {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_USER_KEYS.includes(key)) {
      throw new CloudflareImagesValidationError("Do not send userId for media uploads");
    }

    if (!ALLOWED_UPLOAD_FIELDS.has(key)) {
      throw new CloudflareImagesValidationError(`Invalid media upload field: ${key}`);
    }
  }
}

export function validateImageId(value) {
  const imageId = typeof value === "string" ? value.trim() : "";
  if (!imageId || !IMAGE_ID_PATTERN.test(imageId)) {
    throw new CloudflareImagesValidationError("Invalid imageId");
  }
  return imageId;
}

export function validateImageDirectUploadInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new CloudflareImagesValidationError("Invalid media upload payload");
  }

  assertAllowedKeys(input);

  const clean = {};
  for (const [key, maxLength] of Object.entries(FIELD_LIMITS)) {
    clean[key] = cleanOptionalString(input, key, maxLength);
  }

  if (input.requireSignedURLs !== undefined && typeof input.requireSignedURLs !== "boolean") {
    throw new CloudflareImagesValidationError("requireSignedURLs must be a boolean");
  }

  const fileMetadata = cleanImageFileMetadata(input);

  clean.requireSignedURLs = input.requireSignedURLs === true;
  clean.expiry = cleanOptionalString(input, "expiry", 80);
  clean.fileMimeType = fileMetadata.fileMimeType;
  clean.fileSizeBytes = fileMetadata.fileSizeBytes;

  return clean;
}
