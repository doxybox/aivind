import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("premium badge uses the existing article access fields", () => {
  const badge = readProjectFile("src/components/aivind/PremiumArticleBadge.jsx");

  assert.match(badge, /article\.type === "premium"/);
  assert.match(badge, /article\.accessLevel === "paid"/);
  assert.match(badge, /article\.paywallEnabled/);
  assert.match(badge, /article\.type === "video"/);
  assert.match(badge, /Tekkno plussartikkel - krever abonnement/);
  assert.match(badge, /absolute right-3 top-3 z-20/);
});

test("all public article card variants render the premium badge", () => {
  const files = [
    "src/components/aivind/ArticleCard.jsx",
    "src/components/aivind/HeroArticleCard.jsx",
    "src/components/aivind/SearchOverlay.jsx",
    "src/pages/AiNewspaperPage.jsx",
    "src/pages/NyFrontside1.jsx",
  ];

  for (const file of files) {
    assert.match(readProjectFile(file), /PremiumArticleBadge/);
  }

  assert.match(readProjectFile("src/components/aivind/ArticleCard.jsx"), /article=\{article\} corner/);
  assert.match(readProjectFile("src/components/aivind/HeroArticleCard.jsx"), /article=\{article\} compact corner/);
  assert.match(readProjectFile("src/pages/AiNewspaperPage.jsx"), /article=\{story\} corner/);
  assert.match(readProjectFile("src/pages/NyFrontside1.jsx"), /paywallEnabled \}\} corner/);
});
