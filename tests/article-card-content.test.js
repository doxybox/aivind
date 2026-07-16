import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("article cards do not render excerpts or subtitle descriptions", () => {
  const homepage = readProjectFile("src/pages/NyFrontside1.jsx");
  const categories = readProjectFile("src/pages/AiNewspaperPage.jsx");
  const standardCard = readProjectFile("src/components/aivind/ArticleCard.jsx");

  assert.doesNotMatch(homepage, /subtitle &&/);
  assert.doesNotMatch(homepage, /subtitle=\{/);
  assert.doesNotMatch(categories, /story\.excerpt && <p/);
  assert.doesNotMatch(standardCard, /article\.excerpt &&/);
});

test("article page still renders its ingress and full body", () => {
  const articlePage = readProjectFile("src/pages/artikler/[slug].page.jsx");

  assert.match(articlePage, /article\.excerpt &&/);
  assert.match(articlePage, /paragraphs\.length > 0/);
});

test("the local article template preview stays out of production", () => {
  const legacyArticleData = readProjectFile("src/lib/legacy-article-data.js");

  assert.match(legacyArticleData, /process\.env\.NODE_ENV !== "production"/);
  assert.match(legacyArticleData, /ARTICLE_TEMPLATE_PREVIEW_SLUG/);
});
