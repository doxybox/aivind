import { IMAGE_UPLOAD_LIMITS } from "./cloudflare-images-policy.js";

export const AVATAR_UPLOAD_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  allowedMimeTypes: IMAGE_UPLOAD_LIMITS.allowedMimeTypes,
};

const ALLOWED_FIELDS = new Set(["fileMimeType", "fileSizeBytes", "originalFilename"]);
const FORBIDDEN_FIELDS = new Set(["userId", "user_id", "ownerId", "owner_id", "uploadedBy"]);

export class AvatarUploadValidationError extends Error {
  constructor(message = "Invalid avatar upload request") {
    super(message);
    this.name = "AvatarUploadValidationError";
    this.status = 400;
  }
}

export function validateAvatarDirectUploadInput(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AvatarUploadValidationError("Invalid avatar upload payload");
  }
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(key)) throw new AvatarUploadValidationError("Do not send userId for avatar uploads");
    if (!ALLOWED_FIELDS.has(key)) throw new AvatarUploadValidationError(`Invalid avatar upload field: ${key}`);
  }

  const fileMimeType = typeof input.fileMimeType === "string" ? input.fileMimeType.trim().toLowerCase() : "";
  const fileSizeBytes = Number(input.fileSizeBytes);
  const originalFilename = typeof input.originalFilename === "string" ? input.originalFilename.trim() : "";

  if (!AVATAR_UPLOAD_LIMITS.allowedMimeTypes.includes(fileMimeType)) {
    throw new AvatarUploadValidationError("Unsupported avatar image type");
  }
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes < 1 || fileSizeBytes > AVATAR_UPLOAD_LIMITS.maxBytes) {
    throw new AvatarUploadValidationError("Avatar image must be 2 MB or smaller");
  }
  if (!originalFilename || originalFilename.length > 240) {
    throw new AvatarUploadValidationError("Invalid avatar filename");
  }

  return { fileMimeType, fileSizeBytes, originalFilename };
}

export function isTrustedAvatarUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "imagedelivery.net";
  } catch {
    return false;
  }
}
