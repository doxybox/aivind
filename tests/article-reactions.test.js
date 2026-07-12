import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("article page offers the requested six clickable reactions", () => {
  const source = readProjectFile("src/lib/article-reactions.js");
  const component = readProjectFile("src/components/aivind/ArticleReactions.jsx");

  for (const reaction of ["🔥", "😍", "😮", "😢", "😂", "😡"]) {
    assert.match(source, new RegExp(reaction));
  }
  assert.match(component, /ARTICLE_REACTIONS\.map/);
  assert.match(component, /method: "POST"/);
  assert.match(component, /aria-pressed=\{selected\}/);
  assert.doesNotMatch(component, />\{reactionCount\}<\/span>/);
});

test("article cards show the three most-used reactions without a trailing total", async () => {
  const { getTopArticleReactions } = await import("../src/lib/article-reactions.js");
  const top = getTopArticleReactions({ fire: 1, love: 8, wow: 4, sad: 0, laugh: 6, angry: 2 });

  assert.deepEqual(top.map(({ key, count }) => ({ key, count })), [
    { key: "love", count: 8 },
    { key: "laugh", count: 6 },
    { key: "wow", count: 4 },
  ]);

  assert.deepEqual(getTopArticleReactions({}), []);
});

test("shared article reactions exclude video content", () => {
  const source = readProjectFile("src/components/aivind/ArticleReactions.jsx");

  assert.match(source, /type === "video"/);
  assert.match(source, /category === "video"/);
  assert.match(source, /if \(isVideoArticle\(article\)\) return null/);
});

test("homepage, category, standard, hero and article pages use shared reactions", () => {
  for (const filePath of [
    "src/pages/NyFrontside1.jsx",
    "src/pages/AiNewspaperPage.jsx",
    "src/components/aivind/ArticleCard.jsx",
    "src/components/aivind/HeroArticleCard.jsx",
    "src/pages/artikler/[slug].page.jsx",
  ]) {
    assert.match(readProjectFile(filePath), /ArticleReactions/);
  }

  assert.match(readProjectFile("src/pages/artikler/[slug].page.jsx"), /ArticleReactions article=\{article\}[^>]+interactive/);
});

test("reaction API is actor-scoped, validated and rate limited", () => {
  const api = readProjectFile("src/pages/api/articles/[slug]/reactions.js");
  const schema = readProjectFile("src/db/schema.js");

  assert.match(api, /validateArticleReactionInput/);
  assert.match(api, /validateArticleReactionSlug/);
  assert.match(api, /enforceRateLimit/);
  assert.match(api, /HttpOnly; SameSite=Lax/);
  assert.doesNotMatch(api, /req\.body\.userId/);
  assert.match(schema, /article_reaction_article_actor_idx/);
});
