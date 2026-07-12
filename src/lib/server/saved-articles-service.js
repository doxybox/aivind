import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { savedArticle } from "@/db/schema";
import {
  getArticleById,
  getArticleBySlug,
  mapPayloadArticleToLegacyArticle,
} from "@/lib/server/payload-public-data";
import {
  validateDeleteSavedArticleInput,
  validateSaveArticleInput,
} from "@/lib/server/saved-articles-policy";

function iso(value) {
  return value instanceof Date ? value.toISOString() : value || "";
}

function unavailableSavedArticle(row) {
  return {
    id: row.id,
    saved_id: row.id,
    article_id: row.articleId || "",
    article_slug: row.articleSlug || "",
    slug: row.articleSlug || "",
    title: "Artikkelen er ikke tilgjengelig",
    href: "#",
    excerpt: "",
    category: "",
    imageUrl: "",
    imageAlt: "",
    publishedAt: "",
    created_date: iso(row.createdAt),
    unavailable: true,
    article_title: "Artikkelen er ikke tilgjengelig",
    article_image: "",
    article_category: "",
    article_date: "",
    article_url: "#",
  };
}

export function serializeSavedArticle(row, article = null) {
  if (!article) return unavailableSavedArticle(row);

  const mapped = mapPayloadArticleToLegacyArticle(article);

  return {
    id: row.id,
    saved_id: row.id,
    article_id: row.articleId || String(mapped.id || ""),
    article_slug: row.articleSlug || mapped.slug || "",
    slug: mapped.slug || row.articleSlug || "",
    title: mapped.title,
    href: mapped.href,
    excerpt: mapped.excerpt,
    category: mapped.category,
    imageUrl: mapped.imageUrl,
    imageAlt: mapped.imageAlt,
    publishedAt: mapped.publishedAt,
    created_date: iso(row.createdAt),
    unavailable: false,
    article_title: mapped.title,
    article_image: mapped.imageUrl,
    article_category: mapped.category,
    article_date: mapped.publishedAt,
    article_url: mapped.href,
  };
}

async function resolvePayloadArticle({ articleSlug, articleId }) {
  if (articleSlug) {
    const article = await getArticleBySlug(articleSlug);
    if (article) return article;
  }

  if (articleId) {
    return getArticleById(articleId);
  }

  return null;
}

export async function getSavedArticlesForUser(userId) {
  const rows = await db
    .select()
    .from(savedArticle)
    .where(eq(savedArticle.userId, userId))
    .orderBy(desc(savedArticle.createdAt));

  const articles = await Promise.all(
    rows.map(async (row) => {
      const article = await getArticleBySlug(row.articleSlug);
      return serializeSavedArticle(row, article);
    }),
  );

  return {
    articles,
    count: rows.length,
    configured: true,
  };
}

export async function saveArticleForUser(userId, input = {}) {
  const clean = validateSaveArticleInput(input);
  const article = await resolvePayloadArticle(clean);

  if (!article?.slug) {
    const error = new Error("Article not found");
    error.status = 404;
    throw error;
  }

  const articleSlug = article.slug;
  const articleId = String(article.id || clean.articleId || "");
  const now = new Date();

  const insertedRows = await db
    .insert(savedArticle)
    .values({
      userId,
      articleId: articleId || null,
      articleSlug,
      createdAt: now,
    })
    .onConflictDoNothing({
      target: [savedArticle.userId, savedArticle.articleSlug],
    })
    .returning();

  const row =
    insertedRows[0] ||
    (
      await db
        .select()
        .from(savedArticle)
        .where(and(eq(savedArticle.userId, userId), eq(savedArticle.articleSlug, articleSlug)))
        .limit(1)
    )[0];

  return {
    article: serializeSavedArticle(row, article),
    saved: true,
    duplicate: insertedRows.length === 0,
  };
}

export async function deleteSavedArticleForUser(userId, input = {}) {
  const clean = validateDeleteSavedArticleInput(input);
  const where = clean.id
    ? and(eq(savedArticle.userId, userId), or(eq(savedArticle.id, clean.id), eq(savedArticle.articleId, clean.id)))
    : and(eq(savedArticle.userId, userId), eq(savedArticle.articleSlug, clean.articleSlug));

  const rows = await db.delete(savedArticle).where(where).returning({ id: savedArticle.id });

  return {
    ok: true,
    removed: rows.length,
  };
}
