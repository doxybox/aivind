import { getMarketData, MarketDataError } from "@/lib/server/market-data";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await enforceRateLimit(req, res, {
      scope: "market-data:read",
      ipLimit: 60,
      windowMs: 15 * 60 * 1000,
    });

    const data = await getMarketData();
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (error) {
    const knownError = error instanceof MarketDataError || error instanceof RateLimitError;
    const status = knownError ? error.status : 500;

    if (error instanceof RateLimitError) {
      res.setHeader("Retry-After", String(error.retryAfterSeconds));
    }

    return res.status(status).json({
      error: status === 429 ? error.message : "Kunne ikke hente markedskurser akkurat nå",
    });
  }
}
