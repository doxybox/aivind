import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { assertSameOriginRequest } from "@/lib/server/csrf";
import {
  deleteSavedArticleForUser,
  getSavedArticlesForUser,
  saveArticleForUser,
} from "@/lib/server/saved-articles-service";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error?.status === 401 ? 401 : error?.status || 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req, res) {
  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method !== "GET") assertSameOriginRequest(req);
    const session = await requireAuth(req);
    const userId = session.user.id;

    if (req.method === "GET") {
      const result = await getSavedArticlesForUser(userId);
      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      const result = await saveArticleForUser(userId, req.body || {});
      return res.status(result.duplicate ? 200 : 201).json(result);
    }

    const deleteInput = req.body && typeof req.body === "object" ? { ...req.body } : {};
    const queryId = firstQueryValue(req.query.id);
    const querySlug = firstQueryValue(req.query.slug);
    const queryArticleSlug = firstQueryValue(req.query.articleSlug || req.query.article_slug);
    if (queryId) deleteInput.id = queryId;
    if (querySlug) deleteInput.slug = querySlug;
    if (queryArticleSlug) deleteInput.articleSlug = queryArticleSlug;

    const result = await deleteSavedArticleForUser(userId, deleteInput);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}
