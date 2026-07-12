export function cleanInternalRedirectPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback;

  const path = value.trim();
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }

  return path;
}
