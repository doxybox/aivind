const APP_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

export function setLegacyShimHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
}

export function validateLegacyAppId(req, res) {
  const appId = Array.isArray(req.query.appId) ? req.query.appId[0] : req.query.appId;

  if (!appId || appId === "null" || appId === "undefined" || !APP_ID_PATTERN.test(appId)) {
    res.status(400).json({ error: "Invalid app id" });
    return false;
  }

  return true;
}

export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
