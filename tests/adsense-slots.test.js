import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("AdSense slots stay disabled until explicit public configuration is present", () => {
  const slot = readProjectFile("src/components/aivind/AdSlot.jsx");
  const envExample = readProjectFile(".env.example");
  const payloadSettings = readProjectFile("src/payload/globals/AdvertisingSettings.js");

  assert.match(slot, /api\/adsense\/config/);
  assert.doesNotMatch(slot, /NEXT_PUBLIC_ADSENSE_ENABLED/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_ADSENSE_ENABLED/);
  assert.match(payloadSettings, /slug: "advertising-settings"/);
  assert.match(payloadSettings, /adsenseEnabled/);
  assert.match(payloadSettings, /Slå bare på etter at nettstedet er godkjent/);
  assert.match(payloadSettings, /API-nøkkel/);
  assert.doesNotMatch(payloadSettings, /Ã|â|�/);
});

test("public ad placements share the configured AdSense slot component", () => {
  const homepage = readProjectFile("src/pages/NyFrontside1.jsx");
  const categoryPage = readProjectFile("src/pages/AiNewspaperPage.jsx");
  const articlePage = readProjectFile("src/pages/artikler/[slug].page.jsx");
  const legacyHomepage = readProjectFile("src/pages/Home.jsx");

  assert.match(homepage, /placement="home-primary"/);
  assert.match(homepage, /placement="home-secondary"/);
  assert.match(categoryPage, /placement="category-bottom"/);
  assert.match(articlePage, /placement="article-sidebar-top"/);
  assert.match(articlePage, /placement="article-sidebar-bottom"/);
  assert.match(legacyHomepage, /placement="article-sidebar-bottom"/);
  assert.doesNotMatch(legacyHomepage, /placement="article-sidebar-bottom" className="hidden/);
});
