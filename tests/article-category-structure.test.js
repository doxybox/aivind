import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("article cards omit visual category badges", () => {
  const standardCard = readProjectFile("src/components/aivind/ArticleCard.jsx");
  const heroCard = readProjectFile("src/components/aivind/HeroArticleCard.jsx");
  const categoryTemplate = readProjectFile("src/pages/AiNewspaperPage.jsx");
  const homepage = readProjectFile("src/pages/NyFrontside1.jsx");

  assert.doesNotMatch(standardCard, /isTest \? ['"]TESTER['"] : article\.category/);
  assert.doesNotMatch(heroCard, /article\.type === "test" \? ['"]TESTER['"] : article\.category/);
  assert.doesNotMatch(categoryTemplate, /<Badge>\{story\.tag\}<\/Badge>/);
  assert.doesNotMatch(homepage, />\s*\{tag\}\s*<\/span>/);
});

test("Payload category relationships and category filtering remain intact", () => {
  const payloadData = readProjectFile("src/lib/server/payload-public-data.js");
  const categoryTemplate = readProjectFile("src/pages/AiNewspaperPage.jsx");

  assert.match(payloadData, /categorySlug/);
  assert.match(payloadData, /categories:\s*\{\s*in:\s*\[category\.id\]/);
  assert.match(categoryTemplate, /story\.tag \|\| story\.category \|\| fallbackTag/);
});
