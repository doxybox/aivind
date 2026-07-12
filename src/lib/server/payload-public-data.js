import { getPayloadClient } from "./payload-client.js";
import { getActiveFrontpageSlots as getActiveFrontpageSlotDocs } from "./payload-admin-data.js";

const DEFAULT_IMAGE = "/images/placeholders/article-placeholder.svg";
const DEFAULT_AUTHOR = "AIVIND";

function getRelationshipDoc(value) {
  return value && typeof value === "object" ? value : null;
}

function getRelationshipDocs(value) {
  if (!Array.isArray(value)) return [];
  return value.map(getRelationshipDoc).filter(Boolean);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function logPayloadPublicError(scope, error) {
  console.error(`[payload-public:${scope}]`, error?.message || error);
}

async function withPayloadFallback(scope, fallback, fn) {
  try {
    return await fn();
  } catch (error) {
    logPayloadPublicError(scope, error);
    return fallback;
  }
}

async function withOptionalPayloadFallback(fallback, fn) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function getPublishedArticleWhere({ now = new Date(), extra = [] } = {}) {
  return {
    and: [
      { status: { equals: "published" } },
      { publishedAt: { less_than_equal: now.toISOString() } },
      ...extra,
    ],
  };
}

export function isPublishedPayloadArticle(article = {}, now = new Date()) {
  if (!article || article.status !== "published") return false;

  const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return false;

  return publishedAt <= now;
}

function formatRelativeDate(value) {
  if (!value) return "Nylig";

  const published = new Date(value);
  if (Number.isNaN(published.getTime())) return "Nylig";

  const diffMs = Date.now() - published.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / 36e5));
  if (diffHours < 1) return "Nylig";
  if (diffHours < 24) return `${diffHours} time${diffHours === 1 ? "" : "r"} siden`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} dag${diffDays === 1 ? "" : "er"} siden`;

  return published.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

function estimateReadTime(article) {
  const text = [article?.excerpt, article?.content].filter(Boolean).join(" ");
  if (!text) return "3 min";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min`;
}

export function mapPayloadMediaToImage(mediaAsset) {
  const media = getRelationshipDoc(mediaAsset) || mediaAsset || {};
  return {
    imageUrl: media.deliveryUrl || media.thumbnailUrl || DEFAULT_IMAGE,
    imageAlt: media.alt || media.title || "",
  };
}

export function mapPayloadCategoryToLegacyCategory(category = {}) {
  return {
    id: category.id || "",
    name: category.name || "",
    title: category.name || "",
    slug: category.slug || "",
    href: category.existingRoute || (category.slug ? `/${category.slug}` : "#"),
    description: category.description || "",
    intro: category.description || "",
    seoTitle: category.seoTitle || "",
    seoDescription: category.seoDescription || "",
    isActive: category.isActive !== false,
  };
}

export function mapPayloadArticleToLegacyArticle(article = {}) {
  const categories = getRelationshipDocs(article.categories);
  const authors = getRelationshipDocs(article.authors);
  const primaryCategory = categories[0] || {};
  const primaryAuthor = authors[0] || {};
  const media = mapPayloadMediaToImage(article.heroMedia || article.seoImage);
  const publishedAt = article.publishedAt || article.createdAt || null;
  const categoryName = primaryCategory.name || "Nyheter";
  const categorySlug = primaryCategory.slug || "";

  return {
    id: article.id || article.slug || "",
    title: article.title || "Uten tittel",
    slug: article.slug || "",
    href: article.slug ? `/artikler/${article.slug}` : "#",
    excerpt: article.excerpt || "",
    category: categoryName,
    categorySlug,
    author: primaryAuthor.name || DEFAULT_AUTHOR,
    authorName: primaryAuthor.name || DEFAULT_AUTHOR,
    authorSlug: primaryAuthor.slug || "",
    publishedAt,
    published_at: publishedAt,
    time: formatRelativeDate(publishedAt),
    readTime: estimateReadTime(article),
    comments: 0,
    image: media.imageUrl,
    imageUrl: media.imageUrl,
    imageAlt: media.imageAlt || article.title || "",
    isBreaking: Boolean(article.isBreaking),
    isFeatured: Boolean(article.isFeatured),
    type: article.accessLevel === "paid" || article.paywallEnabled ? "premium" : "standard",
    accessLevel: article.accessLevel || "public",
    paywallEnabled: Boolean(article.paywallEnabled),
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
    canonicalUrl: article.canonicalUrl || "",
  };
}

export function isPayloadArticleRestricted(article = {}) {
  return Boolean(
    article.paywallEnabled ||
      article.accessLevel === "members" ||
      article.accessLevel === "paid",
  );
}

export function mapPayloadArticleToPageData(article = {}, { canReadFullBody = false } = {}) {
  const legacyArticle = mapPayloadArticleToLegacyArticle(article);
  const categories = getRelationshipDocs(article.categories).map(mapPayloadCategoryToLegacyCategory);
  const authors = getRelationshipDocs(article.authors).map((author) => ({
    id: author.id || "",
    name: author.name || DEFAULT_AUTHOR,
    slug: author.slug || "",
    title: author.title || "",
  }));
  const heroMedia = mapPayloadMediaToImage(article.heroMedia || article.seoImage);
  const seoMedia = mapPayloadMediaToImage(article.seoImage || article.heroMedia);
  const restricted = isPayloadArticleRestricted(article);
  const body = restricted && !canReadFullBody ? "" : article.content || "";

  return {
    ...legacyArticle,
    body,
    content: body,
    restricted,
    canReadFullBody: Boolean(canReadFullBody || !restricted),
    categories,
    authors,
    heroImage: heroMedia.imageUrl,
    heroImageAlt: heroMedia.imageAlt || article.title || "",
    seoTitle: article.seoTitle || article.title || "",
    seoDescription: article.seoDescription || article.excerpt || "",
    seoImage: seoMedia.imageUrl,
    canonicalUrl: article.canonicalUrl || "",
    updatedAt: article.updatedAt || article.createdAt || article.publishedAt || "",
  };
}

function mapPayloadReelToLegacyReel(reel = {}) {
  const media = mapPayloadMediaToImage(reel.mediaAsset);
  return {
    id: reel.id || reel.slug || "",
    title: reel.title || "Uten tittel",
    slug: reel.slug || "",
    description: reel.description || "",
    duration: reel.mediaAsset?.duration ? `${Math.round(reel.mediaAsset.duration)}s` : "0:30",
    views: "0",
    image: media.imageUrl,
    imageAlt: media.imageAlt || reel.title || "",
    cloudflareStreamUid: reel.cloudflareStreamUid || reel.mediaAsset?.cloudflareStreamUid || "",
  };
}

export function mapPayloadFrontpageSlotToLegacyItem(slot = {}, { now = new Date() } = {}) {
  const article = getRelationshipDoc(slot.article);
  if (article && !isPublishedPayloadArticle(article, now)) {
    return {
      id: slot.id,
      slotName: slot.slotName || "",
      placement: slot.placement || "",
      priority: slot.priority || 1,
      articleId: article.id || slot.article || null,
      articleSlug: article.slug || "",
      article: null,
    };
  }

  const legacyArticle = article ? mapPayloadArticleToLegacyArticle(article) : null;
  const media = mapPayloadMediaToImage(slot.mediaAsset || article?.heroMedia || article?.seoImage);

  return {
    id: slot.id,
    slotName: slot.slotName || "",
    placement: slot.placement || "",
    priority: slot.priority || 1,
    articleId: article?.id || slot.article || null,
    articleSlug: article?.slug || "",
    article: legacyArticle
      ? {
          ...legacyArticle,
          title: slot.manualTitleOverride || legacyArticle.title,
          excerpt: slot.manualExcerptOverride || legacyArticle.excerpt,
          image: media.imageUrl || legacyArticle.image,
          imageUrl: media.imageUrl || legacyArticle.imageUrl,
          imageAlt: media.imageAlt || legacyArticle.imageAlt,
        }
      : null,
  };
}

export async function getPublishedArticles({ limit = 20, page = 1, now = new Date() } = {}) {
  return withPayloadFallback("getPublishedArticles", [], async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "articles",
      depth: 2,
      limit,
      page,
      overrideAccess: true,
      sort: "-publishedAt",
      where: getPublishedArticleWhere({ now }),
    });

    return safeArray(result.docs);
  });
}

export async function getArticleBySlug(slug, { now = new Date() } = {}) {
  if (!slug) return null;

  return withPayloadFallback("getArticleBySlug", null, async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "articles",
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: getPublishedArticleWhere({
        now,
        extra: [{ slug: { equals: slug } }],
      }),
    });

    return result.docs?.[0] || null;
  });
}

export async function getArticleById(id, { now = new Date() } = {}) {
  if (!id) return null;

  return withPayloadFallback("getArticleById", null, async () => {
    const payload = await getPayloadClient();
    const article = await payload.findByID({
      collection: "articles",
      id,
      depth: 2,
      overrideAccess: true,
    });

    if (!article || article.status !== "published") return null;

    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;
    if (!publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt > now) return null;

    return article;
  });
}

export async function getArticleByCategoryAndSlug(categorySlug, articleSlug, { now = new Date() } = {}) {
  if (!categorySlug || !articleSlug) return null;

  return withPayloadFallback("getArticleByCategoryAndSlug", null, async () => {
    const article = await getArticleBySlug(articleSlug, { now });
    if (!article) return null;

    const categories = getRelationshipDocs(article.categories);
    const matchesCategory = categories.some((category) => {
      return category.slug === categorySlug || category.existingRoute === `/${categorySlug}`;
    });

    return matchesCategory ? article : null;
  });
}

export async function getCategories({ limit = 100 } = {}) {
  return withPayloadFallback("getCategories", [], async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      depth: 1,
      limit,
      overrideAccess: true,
      sort: "sortOrder",
      where: {
        isActive: {
          not_equals: false,
        },
      },
    });

    return safeArray(result.docs);
  });
}

export async function getCategoryBySlug(slug) {
  if (!slug) return null;

  return withPayloadFallback("getCategoryBySlug", null, async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: {
        or: [
          { slug: { equals: slug } },
          { existingRoute: { equals: `/${slug}` } },
        ],
      },
    });

    return result.docs?.[0] || null;
  });
}

export async function getArticlesByCategorySlug(slug, { limit = 20, page = 1, now = new Date() } = {}) {
  if (!slug) return [];

  return withPayloadFallback("getArticlesByCategorySlug", [], async () => {
    const category = await getCategoryBySlug(slug);
    if (!category?.id) return [];

    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "articles",
      depth: 2,
      limit,
      page,
      overrideAccess: true,
      sort: "-publishedAt",
      where: getPublishedArticleWhere({
        now,
        extra: [{ categories: { in: [category.id] } }],
      }),
    });

    return safeArray(result.docs);
  });
}

export async function getAuthors({ limit = 100 } = {}) {
  return withPayloadFallback("getAuthors", [], async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "authors",
      depth: 1,
      limit,
      overrideAccess: true,
      sort: "name",
      where: {
        isActive: {
          not_equals: false,
        },
      },
    });

    return safeArray(result.docs);
  });
}

export async function getAuthorBySlug(slug) {
  if (!slug) return null;

  return withPayloadFallback("getAuthorBySlug", null, async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "authors",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: {
        slug: {
          equals: slug,
        },
      },
    });

    return result.docs?.[0] || null;
  });
}

export async function getActiveFrontpageSlots(options = {}) {
  return withPayloadFallback("getActiveFrontpageSlots", [], async () => {
    const result = await getActiveFrontpageSlotDocs(options);
    return safeArray(result.docs);
  });
}

async function getHomepageReels({ payload, limit = 12 } = {}) {
  if (!payload) return [];

  return withOptionalPayloadFallback([], async () => {
    const result = await payload.find({
      collection: "reels",
      depth: 2,
      limit,
      overrideAccess: true,
      sort: "-publishedAt",
      where: {
        and: [
          { isActive: { equals: true } },
          { status: { equals: "published" } },
        ],
      },
    });

    return safeArray(result.docs).map(mapPayloadReelToLegacyReel);
  });
}

export async function getHomepageContent({ now = new Date(), limit = 24 } = {}) {
  return withPayloadFallback(
    "getHomepageContent",
    {
      source: "payload",
      articles: [],
      categories: [],
      frontpageSlots: [],
      reels: [],
      generatedAt: new Date().toISOString(),
    },
    async () => {
      const payload = await getPayloadClient();
      const [slotDocs, articleDocs, categories, reels] = await Promise.all([
        getActiveFrontpageSlots({ now, limit: 50 }),
        getPublishedArticles({ now, limit }),
        getCategories(),
        getHomepageReels({ payload, limit: 12 }),
      ]);

      const frontpageSlots = slotDocs
        .map((slot) => mapPayloadFrontpageSlotToLegacyItem(slot, { now }))
        .filter((slot) => slot.article);
      const slotArticles = frontpageSlots.map((slot) => slot.article).filter(Boolean);
      const latestArticles = articleDocs.map(mapPayloadArticleToLegacyArticle);
      const slotArticleIds = new Set(slotArticles.map((article) => String(article.id)));
      const articles = [
        ...slotArticles,
        ...latestArticles.filter((article) => !slotArticleIds.has(String(article.id))),
      ];

      return {
        source: "payload",
        articles,
        categories: categories.map(mapPayloadCategoryToLegacyCategory),
        frontpageSlots,
        reels,
        generatedAt: new Date().toISOString(),
      };
    },
  );
}

export async function getPayloadFrontpageData() {
  return getHomepageContent();
}

export async function getPayloadCategoryPage(slug, options = {}) {
  return withPayloadFallback("getPayloadCategoryPage", null, async () => {
    const { allowEmpty = false, ...articleOptions } = options;
    const [category, articleDocs, searchDocs] = await Promise.all([
      getCategoryBySlug(slug),
      getArticlesByCategorySlug(slug, articleOptions),
      getPublishedArticles({ limit: 50 }),
    ]);

    if (!category || (!allowEmpty && articleDocs.length === 0)) return null;

    return {
      category: mapPayloadCategoryToLegacyCategory(category),
      articles: articleDocs.map(mapPayloadArticleToLegacyArticle),
      searchArticles: searchDocs.map(mapPayloadArticleToLegacyArticle),
    };
  });
}
