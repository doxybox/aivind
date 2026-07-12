import { isPlainObject, setLegacyShimHeaders, validateLegacyAppId } from "@/lib/server/legacy-app-shim";

// Deprecated Base44 compatibility shim.
// Kept temporarily so old frontend/runtime calls do not 404 while Base44 is removed.
// TODO: add shared API rate limiting before exposing these shims outside trusted environments.
export default function handler(req, res) {
  setLegacyShimHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateLegacyAppId(req, res)) return;

  if (req.body !== undefined && req.body !== null && !isPlainObject(req.body)) {
    return res.status(400).json({ error: "Invalid analytics payload" });
  }

  const events = req.body?.events || req.body?.batch || [];
  if (events !== undefined && !Array.isArray(events)) {
    return res.status(400).json({ error: "Invalid analytics batch" });
  }

  if (Array.isArray(events) && events.length > 100) {
    return res.status(413).json({ error: "Analytics batch too large" });
  }

  return res.status(204).end();
}
