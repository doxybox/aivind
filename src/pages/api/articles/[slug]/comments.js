import { getLegacyArticleBySlug } from "@/lib/legacy-article-data";
import { getArticleAccessForUser } from "@/lib/server/article-access";
import { getCurrentUser, AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { isPayloadContentSource } from "@/lib/server/content-source";
import { getPayloadClient } from "@/lib/server/payload-client";
import { getArticleBySlug } from "@/lib/server/payload-public-data";
import {
  ArticleCommentValidationError,
  validateArticleCommentInput,
  validateArticleCommentSlug,
} from "@/lib/server/article-comments-policy";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

class CommentArticleUnavailableError extends Error {
  constructor() {
    super("Artikkelen er ikke tilgjengelig for kommentarer");
    this.status = 404;
  }
}

class CommentsDisabledError extends Error {
  constructor() {
    super("Kommentarfeltet er stengt for denne artikkelen");
    this.status = 403;
  }
}

function getAuthorName(user) {
  const preferredName = String(user?.name || "").trim();
  const emailName = String(user?.email || "").split("@")[0].trim();
  return (preferredName || emailName || "TEKKNO-leser").slice(0, 80);
}

function sendError(res, error) {
  const knownError = error instanceof AuthRequiredError || error instanceof ArticleCommentValidationError || error instanceof RateLimitError || error instanceof CommentArticleUnavailableError || error instanceof CommentsDisabledError;
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
    return { commentsEnabled: true, article: null };
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

  return {
    commentsEnabled: article.commentsEnabled !== false,
    article,
  };
}

function relationshipId(value) {
  if (!value) return null;
  return typeof value === "object" ? value.id || null : value;
}

function serializeComment(comment = {}) {
  return {
    id: comment.id,
    authorName: comment.authorName || "TEKKNO-leser",
    body: comment.body || "",
    createdAt: comment.createdAt || null,
    parentCommentId: relationshipId(comment.parentComment),
    isEditorialReply: Boolean(comment.isEditorialReply),
  };
}

function buildCommentWhere(articleSlug, article) {
  const articleMatch = article?.id
    ? {
      or: [
        { article: { equals: article.id } },
        { articleSlug: { equals: articleSlug } },
      ],
    }
    : { articleSlug: { equals: articleSlug } };

  return {
    and: [
      { status: { equals: "published" } },
      articleMatch,
    ],
  };
}

async function getPublishedComments(articleSlug, article) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "article-comments",
    depth: 1,
    limit: 100,
    sort: "createdAt",
    overrideAccess: true,
    where: buildCommentWhere(articleSlug, article),
  });

  return (result.docs || []).map(serializeComment);
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method === "POST") assertSameOriginRequest(req);
    const articleSlug = validateArticleCommentSlug(firstQueryValue(req.query.slug));
    const commentAccess = await requireCommentAccess(req, articleSlug);

    if (req.method === "GET") {
      const comments = commentAccess.commentsEnabled
        ? await getPublishedComments(articleSlug, commentAccess.article)
        : [];
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ comments, count: comments.length, commentsEnabled: commentAccess.commentsEnabled });
    }

    if (!commentAccess.commentsEnabled) {
      throw new CommentsDisabledError();
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
    const payload = await getPayloadClient();
    await payload.create({
      collection: "article-comments",
      overrideAccess: true,
      data: {
        articleSlug,
        ...(commentAccess.article?.id ? { article: commentAccess.article.id } : {}),
        userId: session.user.id,
        authorName: getAuthorName(session.user),
        body: input.body,
        status: "pending",
        isEditorialReply: false,
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(202).json({
      comments: await getPublishedComments(articleSlug, commentAccess.article),
      message: "Kommentaren er sendt til moderering.",
    });
  } catch (error) {
    return sendError(res, error);
  }
}
