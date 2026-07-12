const VALID_CONTENT_SOURCES = new Set(["legacy", "payload"]);

export function getContentSource() {
  const value = (process.env.CONTENT_SOURCE || "legacy").trim().toLowerCase();
  return VALID_CONTENT_SOURCES.has(value) ? value : "legacy";
}

export function isPayloadContentSource() {
  return getContentSource() === "payload";
}
