import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  formatReelDuration,
  validateReelSlugs,
  validateReelViewInput,
} from "../src/lib/reel-views.js";

function readProjectFile(filePath) {
  return readFileSync(new URL(`../${filePath}`, import.meta.url), "utf8");
}

test("reel duration is formatted from real seconds", () => {
  assert.equal(formatReelDuration(31.5), "0:32");
  assert.equal(formatReelDuration(125), "2:05");
  assert.equal(formatReelDuration(3661), "1:01:01");
  assert.equal(formatReelDuration(0), "");
  assert.equal(formatReelDuration("not-a-number"), "");
});

test("reel view input accepts only a valid Payload slug", () => {
  assert.deepEqual(validateReelViewInput({ slug: "ukens-ai-reel" }), { slug: "ukens-ai-reel" });
  assert.deepEqual(validateReelSlugs("ukens-ai-reel,gaming-klipp"), ["ukens-ai-reel", "gaming-klipp"]);
  assert.throws(() => validateReelViewInput({ slug: "ukens-ai-reel", userId: "other-user" }), /Ugyldige felter/);
  assert.throws(() => validateReelViewInput({ slug: "../unsafe" }), /Ugyldig reel/);
});

test("reel views are stored as rate-limited app data without trusting user id", () => {
  const schema = readProjectFile("src/db/schema.js");
  const api = readProjectFile("src/pages/api/reels/views.js");

  assert.match(schema, /export const reelView = pgTable/);
  assert.match(schema, /reel_view_reel_slug_idx/);
  assert.match(api, /getCurrentUser/);
  assert.match(api, /tekkno_reel_viewer/);
  assert.match(api, /enforceRateLimit/);
  assert.match(api, /from\(reels\)/);
  assert.match(api, /eq\(reels\.status, "published"\)/);
  assert.match(api, /eq\(reels\.isActive, true\)/);
  assert.doesNotMatch(api, /req\.body\.userId/);
});

test("reel cards fetch real counts and hide legacy placeholder metrics", () => {
  const section = readProjectFile("src/components/aivind/ReelsSection.jsx");
  const mapper = readProjectFile("src/lib/server/payload-public-data.js");

  assert.match(section, /fetch\(`\/api\/reels\/views\?slugs=/);
  assert.match(section, /method: "POST"/);
  assert.match(section, /Number\.isInteger\(viewCounts\[reel\.slug\]\)/);
  assert.doesNotMatch(section, /views: "1,2k"/);
  assert.doesNotMatch(section, /duration: "0:32"/);
  assert.match(mapper, /duration: formatReelDuration\(mediaAsset\.duration\)/);
  assert.match(mapper, /views: null/);
});
