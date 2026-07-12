import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { articleReaction } from "@/db/schema";
import {
  emptyReactionCounts,
  validateArticleReactionInput,
  validateArticleReactionSlug,
} from "@/lib/article-reactions";
import { getCurrentUser } from "@/lib/server/auth-helpers";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

const ACTOR_COOKIE = "tekkno_reaction_actor";
const ACTOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

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

async function getActor(req, res, { create = false } = {}) {
  const user = await getCurrentUser(req).catch(() => null);
  if (user?.id) return `user:${user.id}`;

  const existing = validAnonymousActor(getCookie(req, ACTOR_COOKIE));
  if (existing) return `anonymous:${existing}`;
  if (!create) return "";

  const actorId = randomUUID();
  setActorCookie(res, actorId);
  return `anonymous:${actorId}`;
}

async function getReactionSummary(articleSlug, actorKey = "") {
  const groupedRows = await db
    .select({ reaction: articleReaction.reaction, value: count() })
    .from(articleReaction)
    .where(eq(articleReaction.articleSlug, articleSlug))
    .groupBy(articleReaction.reaction);

  const counts = emptyReactionCounts();
  for (const row of groupedRows) {
    if (Object.hasOwn(counts, row.reaction)) counts[row.reaction] = Number(row.value) || 0;
  }

  let viewerReaction = null;
  if (actorKey) {
    const [viewerRow] = await db
      .select({ reaction: articleReaction.reaction })
      .from(articleReaction)
      .where(and(eq(articleReaction.articleSlug, articleSlug), eq(articleReaction.actorKey, actorKey)))
      .limit(1);
    viewerReaction = viewerRow?.reaction || null;
  }

  return { counts, viewerReaction };
}

function sendError(res, error) {
  const status = error instanceof RateLimitError ? 429 : error?.status || 500;
  if (error instanceof RateLimitError) res.setHeader("Retry-After", String(error.retryAfterSeconds));
  return res.status(status).json({ error: status === 500 ? "Kunne ikke hente reaksjoner" : error.message });
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const articleSlug = validateArticleReactionSlug(firstQueryValue(req.query.slug));

    if (req.method === "GET") {
      const actorKey = await getActor(req, res);
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).json(await getReactionSummary(articleSlug, actorKey));
    }

    const actorKey = await getActor(req, res, { create: true });
    await enforceRateLimit(req, res, {
      scope: "article-reactions",
      userId: actorKey,
      userLimit: 30,
      ipLimit: 80,
      windowMs: 60 * 1000,
    });

    const { reaction } = validateArticleReactionInput(req.body);
    const [existing] = await db
      .select({ reaction: articleReaction.reaction })
      .from(articleReaction)
      .where(and(eq(articleReaction.articleSlug, articleSlug), eq(articleReaction.actorKey, actorKey)))
      .limit(1);

    if (existing?.reaction === reaction) {
      await db
        .delete(articleReaction)
        .where(and(eq(articleReaction.articleSlug, articleSlug), eq(articleReaction.actorKey, actorKey)));
    } else {
      const now = new Date();
      await db
        .insert(articleReaction)
        .values({ articleSlug, actorKey, reaction, updatedAt: now })
        .onConflictDoUpdate({
          target: [articleReaction.articleSlug, articleReaction.actorKey],
          set: { reaction, updatedAt: now },
        });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(await getReactionSummary(articleSlug, actorKey));
  } catch (error) {
    return sendError(res, error);
  }
}
