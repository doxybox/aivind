import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  normalizeAdSensePublisherId,
  normalizeAdSenseSlotId,
  toAdsTxtLine,
} from "../src/lib/adsense-normalization.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("AdSense slots stay disabled until explicit public configuration is present", () => {
  const slot = readProjectFile("src/components/aivind/AdSlot.jsx");
  const consent = readProjectFile("src/components/aivind/CookieConsentManager.jsx");
  const envExample = readProjectFile(".env.example");
  const payloadSettings = readProjectFile("src/payload/globals/AdvertisingSettings.js");

  assert.match(slot, /api\/adsense\/config/);
  assert.match(slot, /consent\.advertising/);
  assert.match(consent, /Godta alle/);
  assert.match(consent, /Avvis alle/);
  assert.match(consent, /Tilpass valg/);
  assert.doesNotMatch(slot, /NEXT_PUBLIC_ADSENSE_ENABLED/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_ADSENSE_ENABLED/);
  assert.match(payloadSettings, /slug: "advertising-settings"/);
  assert.match(payloadSettings, /adsenseEnabled/);
  assert.match(payloadSettings, /ValidationError/);
  assert.match(payloadSettings, /AdSense annonseplasseringer/);
  assert.match(payloadSettings, /Slik finner du slot-ID-en/);
  assert.match(payloadSettings, /Legg inn en gyldig AdSense Publisher ID og minst én slot-ID/);
  assert.match(payloadSettings, /API-nøkkel/);
  assert.doesNotMatch(payloadSettings, /throw new Error\(/);
  assert.doesNotMatch(payloadSettings, /Ã|â|�/);
});

test("AdSense Publisher ID and slot inputs are normalized safely", () => {
  assert.equal(normalizeAdSensePublisherId("ca-pub-7455442433313586"), "ca-pub-7455442433313586");
  assert.equal(normalizeAdSensePublisherId("client=ca-pub-7455442433313586"), "ca-pub-7455442433313586");
  assert.equal(
    normalizeAdSensePublisherId('<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7455442433313586"></script>'),
    "ca-pub-7455442433313586",
  );
  assert.equal(normalizeAdSensePublisherId("ca-pub-123"), "");

  assert.equal(normalizeAdSenseSlotId("1234567890"), "1234567890");
  assert.equal(normalizeAdSenseSlotId('data-ad-slot="1234567890"'), "1234567890");
  assert.equal(normalizeAdSenseSlotId('<ins class="adsbygoogle" data-ad-slot="1234567890"></ins>'), "1234567890");
  assert.equal(normalizeAdSenseSlotId("slot-123"), "");
  assert.equal(toAdsTxtLine("ca-pub-7455442433313586"), "google.com, pub-7455442433313586, DIRECT, f08c47fec0942fa0");
});

test("public ad placements share the configured AdSense slot component", () => {
  const slot = readProjectFile("src/components/aivind/AdSlot.jsx");
  const homepage = readProjectFile("src/pages/NyFrontside1.jsx");
  const categoryPage = readProjectFile("src/pages/AiNewspaperPage.jsx");
  const articlePage = readProjectFile("src/pages/artikler/[slug].page.jsx");
  const legacyHomepage = readProjectFile("src/pages/Home.jsx");
  const adsTxt = readProjectFile("src/pages/ads.txt.js");

  assert.match(homepage, /placement="home-primary"/);
  assert.match(homepage, /placement="home-secondary"/);
  assert.match(categoryPage, /placement="category-bottom"/);
  assert.match(articlePage, /placement="article-sidebar-top"/);
  assert.match(articlePage, /placement="article-sidebar-bottom"/);
  assert.match(legacyHomepage, /placement="article-sidebar-bottom"/);
  assert.doesNotMatch(legacyHomepage, /placement="article-sidebar-bottom" className="hidden/);
  assert.match(slot, /strategy="afterInteractive"/);
  assert.match(slot, /id="tekkno-adsense-script"/);
  assert.match(slot, /if \(!canServeAds\) return null/);
  assert.match(adsTxt, /toAdsTxtLine\(settings\.client\)/);
});
