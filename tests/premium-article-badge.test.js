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
});
