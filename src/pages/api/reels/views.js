import { randomUUID } from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { reelView } from "@/db/schema";
import { validateReelSlugs, validateReelViewInput } from "@/lib/reel-views";
import { getCurrentUser } from "@/lib/server/auth-helpers";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { reels } from "@/payload-generated-schema";

const ACTOR_COOKIE = "tekkno_reel_viewer";
const ACTOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getCookie(req, name) {
  const cookieHeader = String(req.headers.cookie || "");
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

function validAnonymousActor(value) {
  return /^[a-f0-9-]{36}$/.test(value) ? value : "";
}

function setActorCookie(res, actorId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ACTOR_COOKIE}=${encodeURIComponent(actorId)}; Path=/; Max-Age=${ACTOR_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
  );
}

async function getActor(req, res) {
  const user = await getCurrentUser(req).catch(() => null);
  if (user?.id) return `user:${user.id}`;

  const existing = validAnonymousActor(getCookie(req, ACTOR_COOKIE));
  if (existing) return `anonymous:${existing}`;

  const actorId = randomUUID();
  setActorCookie(res, actorId);
  return `anonymous:${actorId}`;
}

async function getCounts(slugs) {
  const rows = await db
    .select({ slug: reelView.reelSlug, value: count() })
    .from(reelView)
    .where(inArray(reelView.reelSlug, slugs))
    .groupBy(reelView.reelSlug);

  const counts = Object.fromEntries(slugs.map((slug) => [slug, 0]));
  for (const row of rows) counts[row.slug] = Number(row.value) || 0;
  return counts;
}

async function isPublicReelSlug(slug) {
  const [reel] = await db
    .select({ id: reels.id })
    .from(reels)
    .where(and(eq(reels.slug, slug), eq(reels.status, "published"), eq(reels.isActive, true)))
    .limit(1);
  return Boolean(reel);
}

function sendError(res, error) {
  const status = error instanceof RateLimitError ? 429 : error?.status || 500;
  if (error instanceof RateLimitError) res.setHeader("Retry-After", String(error.retryAfterSeconds));
  return res.status(status).json({ error: status === 500 ? "Kunne ikke hente reel-visninger" : error.message });
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method === "GET") {
      const slugs = validateReelSlugs(req.query.slugs);
      res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
      return res.status(200).json({ counts: await getCounts(slugs) });
    }

    const { slug } = validateReelViewInput(req.body);
    const actorKey = await getActor(req, res);
    enforceRateLimit(req, res, {
      scope: "reel-views",
      userId: actorKey,
      userLimit: 30,
      ipLimit: 80,
      windowMs: 60 * 1000,
    });

    if (!(await isPublicReelSlug(slug))) {
      return res.status(404).json({ error: "Reel finnes ikke" });
    }

    const now = new Date();
    await db.insert(reelView).values({ reelSlug: slug, actorKey, lastViewedAt: now });

    res.setHeader("Cache-Control", "private, no-store");
    const counts = await getCounts([slug]);
    return res.status(200).json({ slug, views: counts[slug] });
  } catch (error) {
    return sendError(res, error);
  }
}
