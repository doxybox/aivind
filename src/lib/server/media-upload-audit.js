import { getClientIp } from "./rate-limit.js";

export function logMediaUploadAttempt(req, {
  route,
  status,
  phase,
  user,
  fileMimeType,
  fileSizeBytes,
  statusCode,
} = {}) {
  console.info("[media-upload]", {
    route,
    status,
    phase,
    statusCode,
    userId: user?.id || "",
    userEmail: user?.email || "",
    ip: getClientIp(req),
    fileMimeType: fileMimeType || "",
    fileSizeBytes: fileSizeBytes || undefined,
  });
}
