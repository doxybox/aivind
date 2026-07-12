import { timingSafeEqual } from "node:crypto";
import { sql } from "@/db/client";

function authorized(req) {
  const expected = process.env.CRON_SECRET;
  const provided = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const configuredDays = Number(process.env.REEL_VIEW_RETENTION_DAYS || 395);
  const retentionDays = Number.isInteger(configuredDays) && configuredDays >= 30 && configuredDays <= 730
    ? configuredDays
    : 395;
  const reelCutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const bucketCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const removedViews = await sql`delete from reel_view where last_viewed_at < ${reelCutoff}`;
    const removedBuckets = await sql`delete from rate_limit_bucket where reset_at < ${bucketCutoff}`;
    return res.status(200).json({
      status: "ok",
      removed: {
        reelViews: removedViews.count,
        rateLimitBuckets: removedBuckets.count,
      },
    });
  } catch (error) {
    console.error("[maintenance:analytics] cleanup failed", { message: error?.message });
    return res.status(500).json({ error: "Maintenance failed" });
  }
}
