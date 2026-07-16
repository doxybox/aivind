import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getCloudflareImageUrl } from "../src/lib/server/cloudflare-media.js";
import { getContentSource, isPayloadContentSource } from "../src/lib/server/content-source.js";
import {
  mapPayloadArticleToLegacyArticle,
  mapPayloadArticleToPageData,
  mapPayloadCategoryToLegacyCategory,
  mapPayloadFrontpageSlotToLegacyItem,
  mapPayloadMediaToImage,
  mapPayloadReelToLegacyReel,
} from "../src/lib/server/payload-public-data.js";
import { getCloudflareReelEmbedUrl, getDirectReelVideoUrl } from "../src/lib/reel-playback.js";
import { cleanInternalRedirectPath } from "../src/lib/safe-redirect.js";
import { collections } from "../src/payload/collections/index.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

function listFilesRecursive(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFilesRecursive(fullPath);
    return fullPath;
  });
}

function restoreEnv(key, value) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test("Payload-only CMS collections are active", () => {
  const slugs = collections.map((collection) => collection.slug);

  assert.deepEqual(slugs, [
    "payload-users",
    "media-assets",
    "categories",
    "authors",
    "articles",
    "article-comments",
    "frontpage-slots",
    "reels",
    "tip-submissions",
    "ad-campaigns",
  ]);

  assert.equal(slugs.includes("ghost-post-references"), false);
  assert.equal(slugs.includes("ghost-tag-references"), false);
  assert.equal(slugs.includes("ghost-author-references"), false);
});

test("articles, categories and authors are Payload-owned CMS models", () => {
  const articles = collections.find((collection) => collection.slug === "articles");
  const categories = collections.find((collection) => collection.slug === "categories");
  const authors = collections.find((collection) => collection.slug === "authors");

  assert.ok(articles.fields.some((field) => field.name === "content"));
  assert.ok(articles.fields.some((field) => field.name === "status"));
  assert.ok(articles.fields.some((field) => field.name === "accessLevel"));
  assert.ok(articles.fields.some((field) => field.name === "commentsEnabled"));
  assert.ok(articles.fields.some((field) => field.name === "authors" && field.relationTo === "authors"));
  assert.ok(articles.fields.some((field) => field.name === "categories" && field.relationTo === "categories"));

  assert.ok(categories.fields.some((field) => field.name === "parent" && field.relationTo === "categories"));
  assert.ok(categories.fields.some((field) => field.name === "existingRoute"));

  assert.ok(authors.fields.some((field) => field.name === "profileImage" && field.relationTo === "media-assets"));
  assert.ok(authors.fields.some((field) => field.name === "isActive"));
});

test("Payload owns comment moderation and editorial replies", () => {
  const articleComments = collections.find((collection) => collection.slug === "article-comments");

  assert.ok(articleComments);
  assert.ok(articleComments.fields.some((field) => field.name === "article" && field.relationTo === "articles"));
  assert.ok(articleComments.fields.some((field) => field.name === "parentComment" && field.relationTo === "article-comments"));
  assert.ok(articleComments.fields.some((field) => field.name === "status" && field.defaultValue === "pending"));
  assert.ok(articleComments.fields.some((field) => field.name === "isEditorialReply"));
  assert.ok(articleComments.fields.some((field) => field.name === "moderationNote"));
});

test("frontpage slots and reels point to Payload articles, not Ghost references", () => {
  const frontpageSlots = collections.find((collection) => collection.slug === "frontpage-slots");
  const reels = collections.find((collection) => collection.slug === "reels");

  assert.ok(frontpageSlots.fields.some((field) => field.name === "article" && field.relationTo === "articles"));
  assert.ok(frontpageSlots.fields.some((field) => field.name === "label" && field.admin?.hidden === true));
  assert.ok(frontpageSlots.fields.some((field) => field.name === "slot" && field.admin?.hidden === true));
  assert.ok(frontpageSlots.fields.some((field) => field.name === "position" && field.admin?.hidden === true));
  assert.equal(frontpageSlots.fields.some((field) => field.name.toLowerCase().includes("ghost")), false);

  assert.ok(reels.fields.some((field) => field.name === "article" && field.relationTo === "articles"));
});

test("Ghost is not required by env or server helpers", () => {
  const envExample = readProjectFile(".env.example");
  const serverFiles = readdirSync(path.join(rootDir, "src/lib/server"));

  assert.match(envExample, /Deprecated \/ only if Ghost is explicitly reintroduced later/);
  assert.doesNotMatch(envExample, /^GHOST_/m);
  assert.equal(serverFiles.includes("ghost-client.js"), false);
  assert.equal(serverFiles.includes("ghost-content.js"), false);
});

test("Better Auth remains the application auth system and Supabase Auth is not active", () => {
  const authSource = readProjectFile("src/lib/auth.js");
  const packageJson = JSON.parse(readProjectFile("package.json"));

  assert.match(authSource, /betterAuth/);
  assert.match(authSource, /drizzleAdapter/);
  assert.doesNotMatch(authSource, /supabase\.auth|createClient\(.*auth/s);
  assert.ok(packageJson.dependencies["better-auth"]);
});

test("build configuration does not require Ghost env vars", () => {
  const payloadConfig = readProjectFile("payload.config.js");
  const nextConfig = readProjectFile("next.config.js");

  assert.doesNotMatch(payloadConfig, /GHOST_/);
  assert.doesNotMatch(nextConfig, /GHOST_/);
  assert.match(payloadConfig, /DATABASE_POOL_MAX/);
  assert.match(payloadConfig, /max:\s*payloadPoolMax/);
});

test("Cloudflare image URL uses account hash and variant", () => {
  const previousHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
  process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH = "account-hash";

  assert.equal(
    getCloudflareImageUrl("image-id", "public"),
    "https://imagedelivery.net/account-hash/image-id/public",
  );

  restoreEnv("CLOUDFLARE_IMAGES_ACCOUNT_HASH", previousHash);
});

test("CONTENT_SOURCE defaults to legacy and accepts payload only when configured", () => {
  const previous = process.env.CONTENT_SOURCE;

  delete process.env.CONTENT_SOURCE;
  assert.equal(getContentSource(), "legacy");
  assert.equal(isPayloadContentSource(), false);

  process.env.CONTENT_SOURCE = "payload";
  assert.equal(getContentSource(), "payload");
  assert.equal(isPayloadContentSource(), true);

  process.env.CONTENT_SOURCE = "something-else";
  assert.equal(getContentSource(), "legacy");

  restoreEnv("CONTENT_SOURCE", previous);
});

test("Payload mappers return legacy-safe frontend shapes", () => {
  const mappedImage = mapPayloadMediaToImage({
    deliveryUrl: "https://images.example/payload.jpg",
    alt: "Payload image",
  });
  const fallbackImage = mapPayloadMediaToImage(null);

  assert.equal(mappedImage.imageUrl, "https://images.example/payload.jpg");
  assert.equal(mappedImage.imageAlt, "Payload image");
  assert.equal(fallbackImage.imageUrl, "/images/placeholders/article-placeholder.svg");

  const mappedCategory = mapPayloadCategoryToLegacyCategory({
    id: 1,
    name: "Gaming",
    slug: "gaming",
    existingRoute: "/gaming",
    description: "Spill og maskinvare",
  });

  assert.equal(mappedCategory.href, "/gaming");
  assert.equal(mappedCategory.title, "Gaming");

  const mappedArticle = mapPayloadArticleToLegacyArticle({
    id: 7,
    title: "Payload sak",
    slug: "payload-sak",
    excerpt: "Ingress",
    publishedAt: "2026-06-28T10:00:00.000Z",
    authors: [{ name: "Redaksjonen", slug: "redaksjonen" }],
    categories: [{ name: "AI", slug: "ai" }],
    heroMedia: { deliveryUrl: "https://images.example/hero.jpg", alt: "Hero" },
  });

  assert.equal(mappedArticle.title, "Payload sak");
  assert.equal(mappedArticle.href, "/artikler/payload-sak");
  assert.equal(mappedArticle.category, "AI");
  assert.equal(mappedArticle.author, "Redaksjonen");
  assert.equal(mappedArticle.image, "https://images.example/hero.jpg");
});

test("Payload reels expose a playable Stream source and use the video thumbnail", () => {
  const mappedReel = mapPayloadReelToLegacyReel({
    id: 9,
    title: "Reel fra Payload",
    cloudflareStreamUid: "stream-video-123",
    mediaAsset: {
      deliveryUrl: "https://videodelivery.example/manifest/video.m3u8",
      thumbnailUrl: "https://videodelivery.example/thumbnail.jpg",
      duration: 31,
    },
  });

  assert.equal(mappedReel.image, "https://videodelivery.example/thumbnail.jpg");
  assert.equal(mappedReel.videoUrl, "https://videodelivery.example/manifest/video.m3u8");
  assert.equal(mappedReel.cloudflareStreamUid, "stream-video-123");
  assert.equal(mappedReel.duration, "0:31");
  assert.equal(mappedReel.views, null);
  assert.equal(getCloudflareReelEmbedUrl(mappedReel), "https://iframe.videodelivery.net/stream-video-123?autoplay=true");
});

test("reel playback accepts direct video files but rejects unsafe and HLS fallback URLs", () => {
  assert.equal(getCloudflareReelEmbedUrl(null), "");
  assert.equal(getDirectReelVideoUrl(null), "");
  assert.equal(getDirectReelVideoUrl({ videoUrl: "/video/reel.webm" }), "/video/reel.webm");
  assert.equal(getDirectReelVideoUrl({ videoUrl: "https://cdn.example/reel.mp4?token=public" }), "https://cdn.example/reel.mp4?token=public");
  assert.equal(getDirectReelVideoUrl({ videoUrl: "https://cdn.example/manifest.m3u8" }), "");
  assert.equal(getDirectReelVideoUrl({ videoUrl: "javascript:alert(1).mp4" }), "");
  assert.equal(getCloudflareReelEmbedUrl({ cloudflareStreamUid: "../unsafe" }), "");
});

test("Payload article page mapper hides restricted body without server entitlement", () => {
  const mapped = mapPayloadArticleToPageData({
    id: 12,
    title: "Premium sak",
    slug: "premium-sak",
    excerpt: "Ingress vises",
    content: "Skjult premiumtekst",
    status: "published",
    publishedAt: "2026-06-28T10:00:00.000Z",
    accessLevel: "paid",
    paywallEnabled: true,
  });

  assert.equal(mapped.restricted, true);
  assert.equal(mapped.canReadFullBody, false);
  assert.equal(mapped.body, "");
  assert.equal(mapped.excerpt, "Ingress vises");
});

test("Payload article page mapper includes body when server entitlement allows it", () => {
  const mapped = mapPayloadArticleToPageData(
    {
      id: 13,
      title: "Premium sak",
      slug: "premium-sak",
      excerpt: "Ingress",
      content: "Synlig premiumtekst",
      status: "published",
      publishedAt: "2026-06-28T10:00:00.000Z",
      accessLevel: "paid",
      paywallEnabled: true,
    },
    { canReadFullBody: true },
  );

  assert.equal(mapped.restricted, true);
  assert.equal(mapped.canReadFullBody, true);
  assert.equal(mapped.body, "Synlig premiumtekst");
});

test("stable public article route exists", () => {
  assert.equal(existsSync(path.join(rootDir, "src/pages/artikler/[slug].page.jsx")), true);
});

test("Payload public rendering verification scripts are manually runnable", () => {
  const packageJson = JSON.parse(readProjectFile("package.json"));
  const verifyScript = readProjectFile("scripts/verify-payload-public-rendering.js");
  const seedScript = readProjectFile("scripts/seed-payload-demo-content.js");

  assert.equal(
    packageJson.scripts["payload:verify-public-rendering"],
    "node --import tsx scripts/verify-payload-public-rendering.js",
  );
  assert.equal(
    packageJson.scripts["payload:seed-demo-content"],
    "node --import tsx scripts/seed-payload-demo-content.js",
  );
  assert.match(verifyScript, /--strict/);
  assert.match(seedScript, /ALLOW_PAYLOAD_DEMO_SEED/);
  assert.match(seedScript, /process\.exit\(0\)/);
  assert.match(seedScript, /OPERATION_TIMEOUT_MS/);
  assert.doesNotMatch(verifyScript, /password|service_role|sb_secret/i);
  assert.doesNotMatch(seedScript, /password|service_role|sb_secret/i);
});

test("Payload public article helper filters public reads to published past articles", () => {
  const source = readProjectFile("src/lib/server/payload-public-data.js");

  assert.match(source, /status:\s*\{\s*equals:\s*"published"\s*\}/);
  assert.match(source, /publishedAt:\s*\{\s*less_than_equal:/);
});

test("Payload frontpage slots do not expose draft or future article references", () => {
  const now = new Date("2026-06-29T12:00:00.000Z");
  const draftSlot = mapPayloadFrontpageSlotToLegacyItem(
    {
      id: "slot-1",
      slotName: "Draft slot",
      placement: "hero",
      article: {
        id: "draft-1",
        title: "Draft should not leak",
        slug: "draft-should-not-leak",
        excerpt: "Hidden",
        status: "draft",
        publishedAt: null,
      },
    },
    { now },
  );
  const futureSlot = mapPayloadFrontpageSlotToLegacyItem(
    {
      id: "slot-2",
      slotName: "Future slot",
      placement: "hero",
      article: {
        id: "future-1",
        title: "Future should not leak",
        slug: "future-should-not-leak",
        excerpt: "Hidden",
        status: "published",
        publishedAt: "2026-06-30T12:00:00.000Z",
      },
    },
    { now },
  );

  assert.equal(draftSlot.article, null);
  assert.equal(futureSlot.article, null);
});

test("Payload frontpage slot helper treats null schedule dates as active windows", () => {
  const source = readProjectFile("src/lib/server/payload-admin-data.js");

  assert.match(source, /startsAt:\s*\{\s*equals:\s*null\s*\}/);
  assert.match(source, /expiresAt:\s*\{\s*equals:\s*null\s*\}/);
});

test("login callback redirects are limited to internal paths", () => {
  assert.equal(cleanInternalRedirectPath("/min-side?upgrade=true", "/min-side"), "/min-side?upgrade=true");
  assert.equal(cleanInternalRedirectPath("https://evil.example/phish", "/min-side"), "/min-side");
  assert.equal(cleanInternalRedirectPath("//evil.example/phish", "/min-side"), "/min-side");
});

test("public rendering keeps legacy default and wires Payload only behind server flag", () => {
  const envExample = readProjectFile(".env.example");
  const homeRoute = readProjectFile("src/pages/index.page.jsx");
  const categoryRoute = readProjectFile("src/pages/gaming.page.jsx");
  const aiRoute = readProjectFile("src/pages/ai.page.jsx");

  assert.match(envExample, /^CONTENT_SOURCE=legacy$/m);
  assert.match(homeRoute, /isPayloadContentSource\(\)/);
  assert.match(homeRoute, /getHomepageContent/);
  assert.match(categoryRoute, /isPayloadContentSource\(\)/);
  assert.match(categoryRoute, /getPayloadCategoryPage\("gaming"\)/);
  assert.match(aiRoute, /isPayloadContentSource\(\)/);
  assert.match(aiRoute, /getPayloadCategoryPage\("ai",\s*\{\s*allowEmpty:\s*true\s*\}\)/);
});

test("AI page uses Payload category data only when CONTENT_SOURCE=payload", () => {
  const routeSource = readProjectFile("src/pages/ai.page.jsx");
  const pageSource = readProjectFile("src/pages/AiNewspaperPage.jsx");

  assert.match(routeSource, /payloadMode:\s*false/);
  assert.match(routeSource, /payloadMode:\s*true/);
  assert.match(routeSource, /getPayloadCategoryPage\("ai"/);
  assert.match(pageSource, /payloadCategoryPage/);
  assert.match(pageSource, /payloadStories/);
  assert.match(pageSource, /PayloadEmptyState/);
  assert.match(pageSource, /Drafts, fremtidige saker og upublisert innhold skjules/);
});

test("Payload category helper can return empty category page for explicit fallback states", () => {
  const source = readProjectFile("src/lib/server/payload-public-data.js");

  assert.match(source, /allowEmpty\s*=\s*false/);
  assert.match(source, /!\s*allowEmpty\s*&&\s*articleDocs\.length === 0/);
});

test("Payload demo seed covers AI public, members, paid and draft content without media dependency", () => {
  const seedScript = readProjectFile("scripts/seed-payload-demo-content.js");

  assert.match(seedScript, /slug:\s*"ai"/);
  assert.match(seedScript, /existingRoute:\s*"\/ai"/);
  assert.match(seedScript, /demo-payload-driver-ai-forsiden/);
  assert.match(seedScript, /demo-ai-medlemssak-fra-payload/);
  assert.match(seedScript, /accessLevel:\s*"members"/);
  assert.match(seedScript, /demo-ai-paywall-skjuler-fulltekst/);
  assert.match(seedScript, /paywallEnabled:\s*true/);
  assert.match(seedScript, /demo-ai-draft-skal-ikke-lekke/);
  assert.match(seedScript, /status:\s*"draft"/);
  assert.match(seedScript, /demo-ai-future-skal-ikke-lekke/);
  assert.match(seedScript, /2099-01-01T12:00:00\.000Z/);
  assert.match(seedScript, /label:\s*slotName/);
  assert.match(seedScript, /slot:\s*"hero-main"/);
  assert.match(seedScript, /position:\s*1/);
  assert.doesNotMatch(seedScript, /heroMedia|seoImage|cloudflare/i);
});

test("homepage accepts empty Payload data and the old nyfrontside1 route is removed", () => {
  const routeSource = readProjectFile("src/pages/index.page.jsx");
  const pageSource = readProjectFile("src/pages/NyFrontside1.jsx");

  assert.match(routeSource, /getHomepageContent/);
  assert.match(routeSource, /payloadHomepageContent/);
  assert.match(pageSource, /payloadCard/);
  assert.match(pageSource, /topHero/);
  assert.match(pageSource, /topSideCards/);
  assert.match(pageSource, /middleCards/);
  assert.match(pageSource, /hasContentArticles/);
  assert.match(pageSource, /payloadReels\.length > 0/);
  assert.match(pageSource, /allArticles/);
  assert.equal(existsSync(path.join(rootDir, "src/pages/nyfrontside1.page.jsx")), false);
  assert.doesNotMatch(pageSource, /href="\/nyfrontside1"/);
});

test("Payload homepage articles are not discarded when optional reels fail", () => {
  const source = readProjectFile("src/lib/server/payload-public-data.js");

  assert.match(source, /getHomepageReels/);
  assert.match(source, /withOptionalPayloadFallback\(\[\]/);
  assert.match(source, /getPublishedArticles\(\{\s*now,\s*limit\s*\}\)/);
  assert.match(source, /articles,\s*\n\s*categories:/);
  assert.doesNotMatch(source, /safeArray\(reels\.docs\)/);
});

test("stable public article route uses non-conflicting artikler slug pattern", () => {
  const routeSource = readProjectFile("src/pages/artikler/[slug].page.jsx");

  assert.match(routeSource, /getArticleBySlug\(slug\)/);
  assert.match(routeSource, /getLegacyArticleBySlug\(slug\)/);
  assert.match(routeSource, /notFound:\s*true/);
  assert.match(routeSource, /getArticleAccessForUser/);
  assert.match(routeSource, /property="og:type" content="article"/);
});

test("old Ghost reference collection files are removed from active source", () => {
  assert.equal(existsSync(path.join(rootDir, "src/payload/collections/GhostPostReferences.js")), false);
  assert.equal(existsSync(path.join(rootDir, "src/payload/collections/GhostTagReferences.js")), false);
  assert.equal(existsSync(path.join(rootDir, "src/payload/collections/GhostAuthorReferences.js")), false);
});

test("frontend components and pages do not import the Base44 SDK client directly", () => {
  const files = [
    ...listFilesRecursive(path.join(rootDir, "src/components")),
    ...listFilesRecursive(path.join(rootDir, "src/pages")),
  ].filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));

  const offenders = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    return source.includes("@/api/base44Client") || source.includes("../api/base44Client");
  });

  assert.deepEqual(offenders.map((file) => path.relative(rootDir, file)), []);
});

test("active frontend and content fallbacks use owned image assets", () => {
  const files = [
    ...listFilesRecursive(path.join(rootDir, "src")),
    ...listFilesRecursive(path.join(rootDir, "scripts")),
  ].filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
  const unstableHosts = /logo\.clearbit\.com|images\.unsplash\.com|media\.base44\.com|i\.pravatar\.cc/i;
  const offenders = files.filter((file) => unstableHosts.test(readFileSync(file, "utf8")));

  assert.deepEqual(offenders.map((file) => path.relative(rootDir, file)), []);
  assert.equal(
    existsSync(path.join(rootDir, "public/images/placeholders/article-placeholder.svg")),
    true,
  );
  assert.equal(
    existsSync(path.join(rootDir, "public/images/placeholders/avatar-placeholder.svg")),
    true,
  );
  assert.equal(
    existsSync(path.join(rootDir, "public/images/placeholders/account-background.svg")),
    true,
  );
});

test("Base44 compatibility shims are deprecated and hardened", () => {
  const helper = readProjectFile("src/lib/server/legacy-app-shim.js");
  const userShim = readProjectFile("src/pages/api/apps/[appId]/entities/User/me.js");
  const analyticsShim = readProjectFile("src/pages/api/apps/[appId]/analytics/track/batch.js");
  const marketShim = readProjectFile("src/pages/api/apps/[appId]/functions/getMarketData.js");
  const nextConfig = readProjectFile("next.config.js");

  assert.match(helper, /validateLegacyAppId/);
  assert.match(helper, /Cache-Control/);
  assert.match(userShim, /Deprecated Base44 compatibility shim/);
  assert.match(userShim, /validateLegacyAppId/);
  assert.match(analyticsShim, /TODO: add shared API rate limiting/);
  assert.match(analyticsShim, /Invalid analytics payload/);
  assert.match(marketShim, /Invalid request payload/);
  assert.match(nextConfig, /ALLOW_BASE44_API_REWRITE/);
  assert.match(nextConfig, /NODE_ENV === "production"/);
});
