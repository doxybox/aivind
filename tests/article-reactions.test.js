import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("shared article reactions render the requested emojis and include zero counts", () => {
  const source = readProjectFile("src/components/aivind/ArticleReactions.jsx");

  assert.match(source, /😲/);
  assert.match(source, /😂/);
  assert.match(source, /😍/);
  assert.match(source, /\?\? 0/);
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
});
