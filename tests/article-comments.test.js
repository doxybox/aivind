import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  ArticleCommentValidationError,
  validateArticleCommentInput,
  validateArticleCommentSlug,
} from "../src/lib/server/article-comments-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("comment policy validates article slugs and comment bodies", () => {
  assert.equal(validateArticleCommentSlug("payload-artikkel-1"), "payload-artikkel-1");
  assert.deepEqual(validateArticleCommentInput({ body: "God og saklig kommentar." }), {
    body: "God og saklig kommentar.",
  });
  assert.throws(() => validateArticleCommentSlug("../admin"), ArticleCommentValidationError);
  assert.throws(() => validateArticleCommentInput({ body: "x" }), ArticleCommentValidationError);
  assert.throws(() => validateArticleCommentInput({ body: "Hei", userId: "another-user" }), ArticleCommentValidationError);
});

test("article comment API uses the authenticated session and applies rate limits", () => {
  const api = readProjectFile("src/pages/api/articles/[slug]/comments.js");
  const schema = readProjectFile("src/db/schema.js");
  const moderationMigration = readProjectFile("src/migrations/20260716_040000_article_comments_moderation.ts");

  assert.match(api, /requireAuth\(req\)/);
  assert.match(api, /validateArticleCommentInput/);
  assert.match(api, /validateArticleCommentSlug/);
  assert.match(api, /requireCommentAccess/);
  assert.match(api, /enforceRateLimit/);
  assert.match(api, /collection: "article-comments"/);
  assert.match(api, /status: "pending"/);
  assert.match(api, /commentsEnabled/);
  assert.doesNotMatch(api, /req\.body\.userId/);
  assert.match(schema, /export const articleComment = pgTable\(/);
  assert.match(schema, /"article_comment"/);
  assert.match(schema, /article_comment_article_slug_created_at_idx/);
  assert.match(moderationMigration, /CREATE TABLE IF NOT EXISTS "article_comments"/);
  assert.match(moderationMigration, /comments_enabled/);
});

test("public article surfaces no longer render emoji reactions", () => {
  for (const filePath of [
    "src/pages/NyFrontside1.jsx",
    "src/pages/AiNewspaperPage.jsx",
    "src/pages/artikler/[slug].page.jsx",
    "src/components/aivind/ArticleCard.jsx",
    "src/components/aivind/HeroArticleCard.jsx",
    "src/components/aivind/HeroSection.jsx",
    "src/components/aivind/TrendingSidebar.jsx",
  ]) {
    assert.doesNotMatch(readProjectFile(filePath), /ArticleReactions/);
  }

  assert.match(readProjectFile("src/pages/artikler/[slug].page.jsx"), /ArticleComments/);
});
