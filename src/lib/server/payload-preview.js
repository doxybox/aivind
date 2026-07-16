import { createHmac, timingSafeEqual } from "crypto";

const PREVIEW_TTL_MS = 10 * 60 * 1000;

function getPreviewSecret() {
  return process.env.PAYLOAD_PREVIEW_SECRET || process.env.PAYLOAD_SECRET || "";
}

function signPreviewPayload(value) {
  return createHmac("sha256", getPreviewSecret()).update(value).digest("base64url");
}

export function createPayloadPreviewToken(slug, now = Date.now()) {
  if (!getPreviewSecret() || !slug) return null;

  const issuedAt = String(now);
  return `${issuedAt}.${signPreviewPayload(`${slug}:${issuedAt}`)}`;
}

export function verifyPayloadPreviewToken(slug, token, now = Date.now()) {
  if (!getPreviewSecret() || !slug || !token) return false;

  const [issuedAt, signature] = String(token).split(".");
  const issuedAtNumber = Number(issuedAt);
  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) return false;
  if (issuedAtNumber > now || now - issuedAtNumber > PREVIEW_TTL_MS) return false;

  const expectedBuffer = Buffer.from(signPreviewPayload(`${slug}:${issuedAt}`));
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
