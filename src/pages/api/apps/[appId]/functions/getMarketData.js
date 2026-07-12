import { fallbackMarketData } from "@/lib/market-data-fallback";
import { isPlainObject, setLegacyShimHeaders, validateLegacyAppId } from "@/lib/server/legacy-app-shim";

// Deprecated Base44 compatibility shim.
// New frontend code should import fallback data or use a future first-party market API.
// TODO: add shared API rate limiting before exposing these shims outside trusted environments.
export default function handler(req, res) {
  setLegacyShimHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateLegacyAppId(req, res)) return;

  if (req.body !== undefined && req.body !== null && !isPlainObject(req.body)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  return res.status(200).json(fallbackMarketData);
}
