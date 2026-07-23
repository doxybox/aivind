export const ADSENSE_PUBLISHER_ID_PATTERN = /^ca-pub-\d{16}$/;
export const ADSENSE_SLOT_ID_PATTERN = /^\d{6,20}$/;

export function normalizeAdSensePublisherId(value) {
  const rawValue = typeof value === "string" ? value.trim() : "";
  const match = rawValue.match(/(?:client\s*=\s*["']?)?(ca-pub-\d{16})\b/i);
  const publisherId = match?.[1]?.toLowerCase() || "";

  return ADSENSE_PUBLISHER_ID_PATTERN.test(publisherId) ? publisherId : "";
}

export function normalizeAdSenseSlotId(value) {
  const rawValue = typeof value === "string" ? value.trim() : "";
  const embeddedSlot = rawValue.match(/data-ad-slot\s*=\s*["']?(\d{6,20})\b/i)?.[1];
  const slotId = embeddedSlot || rawValue.replace(/\s+/g, "");

  return ADSENSE_SLOT_ID_PATTERN.test(slotId) ? slotId : "";
}

export function toAdsTxtLine(publisherId) {
  const normalizedPublisherId = normalizeAdSensePublisherId(publisherId);
  if (!normalizedPublisherId) return "";

  return `google.com, ${normalizedPublisherId.slice(3)}, DIRECT, f08c47fec0942fa0`;
}
