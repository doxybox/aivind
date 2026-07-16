import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { articleComment } from "@/db/schema";
import { getLegacyArticleBySlug } from "@/lib/legacy-article-data";
import { getArticleAccessForUser } from "@/lib/server/article-access";
import { getCurrentUser, AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { isPayloadContentSource } from "@/lib/server/content-source";
import { getArticleBySlug } from "@/lib/server/payload-public-data";
import {
  ArticleCommentValidationError,
  validateArticleCommentInput,
  validateArticleCommentSlug,
} from "@/lib/server/article-comments-policy";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

class CommentArticleUnavailableError extends Error {
  constructor() {
    super("Artikkelen er ikke tilgjengelig for kommentarer");
    this.status = 404;
  }
}

function getAuthorName(user) {
  const preferredName = String(user?.name || "").trim();
  const emailName = String(user?.email || "").split("@")[0].trim();
  return (preferredName || emailName || "TEKKNO-leser").slice(0, 80);
}

function sendError(res, error) {
  const knownError = error instanceof AuthRequiredError || error instanceof ArticleCommentValidationError || error instanceof RateLimitError || error instanceof CommentArticleUnavailableError;
  const status = knownError ? error.status : 500;

  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }

  return res.status(status).json({
    error: knownError ? error.message : "Kunne ikke handtere kommentaren akkurat na",
  });
}

async function requireCommentAccess(req, articleSlug) {
  if (!isPayloadContentSource()) {
    if (!getLegacyArticleBySlug(articleSlug)) {
      throw new CommentArticleUnavailableError();
    }
    return;
  }

  const article = await getArticleBySlug(articleSlug);
  if (!article) {
    throw new CommentArticleUnavailableError();
  }

  const user = await getCurrentUser(req);
  const access = await getArticleAccessForUser(user, article);
  if (!access.canReadFullBody) {
    throw new CommentArticleUnavailableError();
  }
}

async function getPublishedComments(articleSlug) {
  return db
    .select({
      id: articleComment.id,
      authorName: articleComment.authorName,
      body: articleComment.body,
      createdAt: articleComment.createdAt,
    })
    .from(articleComment)
    .where(and(eq(articleComment.articleSlug, articleSlug), eq(articleComment.status, "published")))
    .orderBy(desc(articleComment.createdAt))
    .limit(100);
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const articleSlug = validateArticleCommentSlug(firstQueryValue(req.query.slug));
    await requireCommentAccess(req, articleSlug);

    if (req.method === "GET") {
      const comments = await getPublishedComments(articleSlug);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ comments, count: comments.length });
    }

    const session = await requireAuth(req);
    await enforceRateLimit(req, res, {
      scope: "article-comments",
      userId: session.user.id,
      userLimit: 5,
      ipLimit: 15,
      windowMs: 5 * 60 * 1000,
    });

    const input = validateArticleCommentInput(req.body);
    const [comment] = await db
      .insert(articleComment)
      .values({
        articleSlug,
        userId: session.user.id,
        authorName: getAuthorName(session.user),
        body: input.body,
      })
      .returning({
        id: articleComment.id,
        authorName: articleComment.authorName,
        body: articleComment.body,
        createdAt: articleComment.createdAt,
      });

    const comments = await getPublishedComments(articleSlug);
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({ comment, comments, count: comments.length });
  } catch (error) {
    return sendError(res, error);
  }
}
