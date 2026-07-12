import {
  getActiveFrontpageSlots,
  getAuthors,
  getCategories,
  getHomepageContent,
  getPublishedArticles,
  mapPayloadArticleToLegacyArticle,
  mapPayloadArticleToPageData,
} from "../src/lib/server/payload-public-data.js";
import { getContentSource } from "../src/lib/server/content-source.js";

const strict = process.argv.includes("--strict") || process.env.PAYLOAD_VERIFY_STRICT === "true";
const timeoutMs = Number(process.env.PAYLOAD_VERIFY_TIMEOUT_MS || 30000);

function compactArticle(article) {
  return {
    id: article.id || null,
    slug: article.slug || null,
    title: article.title || null,
    status: article.status || null,
    category: article.categories?.[0]?.name || article.categories?.[0] || null,
    author: article.authors?.[0]?.name || article.authors?.[0] || null,
  };
}

function pushWarning(warnings, message) {
  warnings.push(message);
}

function pushError(errors, message) {
  errors.push(message);
}

function assertPublishedArticleShape(article, errors) {
  if (!article.title) pushError(errors, `Published article is missing title: ${article.id || article.slug || "unknown"}`);
  if (!article.slug) pushError(errors, `Published article is missing slug: ${article.id || article.title || "unknown"}`);
  if (article.status !== "published") pushError(errors, `Non-published article returned from public helper: ${article.slug || article.id}`);
}

function verifyMappings(article, errors) {
  const legacy = mapPayloadArticleToLegacyArticle(article);
  const page = mapPayloadArticleToPageData(article);

  if (!legacy.title || !legacy.href || !legacy.image) {
    pushError(errors, `Legacy mapper returned incomplete article shape for ${article.slug || article.id}`);
  }

  if (!page.title || !page.heroImage || page.canReadFullBody !== !page.restricted) {
    pushError(errors, `Article page mapper returned inconsistent page shape for ${article.slug || article.id}`);
  }
}

function verifyFrontpageSlots(slots, errors, warnings) {
  for (const slot of slots) {
    if (!slot.article) {
      pushError(errors, `Active frontpage slot has no article: ${slot.slotName || slot.id}`);
      continue;
    }

    const article = typeof slot.article === "object" ? slot.article : null;
    if (!article) {
      pushError(errors, `Active frontpage slot article was not populated: ${slot.slotName || slot.id}`);
      continue;
    }

    if (article.status && article.status !== "published") {
      pushError(errors, `Active frontpage slot points to non-published article: ${slot.slotName || slot.id}`);
    }

    if (!article.slug || !article.title) {
      pushError(errors, `Active frontpage slot points to article missing title/slug: ${slot.slotName || slot.id}`);
    }
  }

  if (slots.length === 0) {
    pushWarning(warnings, "No active frontpage slots found. Homepage should fall back to latest published Payload articles.");
  }
}

async function collectPayloadPublicRenderingData() {
  return Promise.all([
    getPublishedArticles({ limit: 25 }),
    getCategories(),
    getAuthors(),
    getActiveFrontpageSlots(),
    getHomepageContent({ limit: 12 }),
  ]);
}

function timeoutResult() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        timedOut: true,
        data: [[], [], [], [], { articles: [], reels: [] }],
      });
    }, timeoutMs);
  });
}

async function main() {
  const warnings = [];
  const errors = [];

  const result = await Promise.race([
    collectPayloadPublicRenderingData().then((data) => ({ timedOut: false, data })),
    timeoutResult(),
  ]);

  if (result.timedOut) {
    pushWarning(warnings, `Payload public rendering verification timed out after ${timeoutMs}ms. Check DATABASE_URI/PAYLOAD_DATABASE_URL and network access.`);
    if (strict) pushError(errors, "Strict mode requires Payload verification to complete before timeout.");
  }

  const [articles, categories, authors, frontpageSlots, homepage] = result.data;

  if (articles.length === 0) {
    pushWarning(warnings, "No published Payload articles found.");
    if (strict) pushError(errors, "Strict mode requires at least one published article.");
  } else {
    assertPublishedArticleShape(articles[0], errors);
    verifyMappings(articles[0], errors);
  }

  if (categories.length === 0) {
    pushWarning(warnings, "No active Payload categories found.");
    if (strict) pushError(errors, "Strict mode requires at least one active category.");
  }

  if (authors.length === 0) {
    pushWarning(warnings, "No active Payload authors found.");
    if (strict) pushError(errors, "Strict mode requires at least one active author.");
  }

  verifyFrontpageSlots(frontpageSlots, errors, warnings);

  if (homepage.articles.length === 0) {
    pushWarning(warnings, "Homepage helper returned no articles.");
    if (strict) pushError(errors, "Strict mode requires homepage articles.");
  }

  const payloadCategorySlugs = categories.map((category) => category.slug).filter(Boolean);
  const firstArticle = articles[0] ? compactArticle(articles[0]) : null;

  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        strict,
        contentSource: getContentSource(),
        counts: {
          publishedArticles: articles.length,
          categories: categories.length,
          authors: authors.length,
          activeFrontpageSlots: frontpageSlots.length,
          homepageArticles: homepage.articles.length,
          homepageReels: homepage.reels.length,
        },
        routesToCheck: {
          homepage: "/",
          category: payloadCategorySlugs[0] ? `/${payloadCategorySlugs[0]}` : "/gaming",
          article: firstArticle?.slug ? `/artikler/${firstArticle.slug}` : "/artikler/<published-article-slug>",
        },
        firstPublishedArticle: firstArticle,
        warnings,
        errors,
      },
      null,
      2,
    ),
  );

  if (errors.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[verify-payload-public-rendering]", error?.message || error);
  process.exit(1);
});
