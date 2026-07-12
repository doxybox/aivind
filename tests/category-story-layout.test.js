import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fillCategoryStories } from "../src/lib/category-story-layout.js";

const rootDir = process.cwd();

test("sparse Payload categories keep real stories and fill the shared layout", () => {
  const payloadStories = [{ id: "payload-1", slug: "ekte-gaming", href: "/artikler/ekte-gaming", title: "Ekte Gaming" }];
  const fallbackStories = Array.from({ length: 8 }, (_, index) => ({
    id: `legacy-${index}`,
    slug: `legacy-${index}`,
    href: `/artikler/legacy-${index}`,
    title: `Reserve ${index}`,
  }));

  const result = fillCategoryStories(payloadStories, fallbackStories, 7);

  assert.equal(result.length, 7);
  assert.equal(result[0].href, "/artikler/ekte-gaming");
  assert.equal(result[0].displayFallback, undefined);
  assert.equal(result[1].href, undefined);
  assert.equal(result[1].slug, undefined);
  assert.equal(result[1].displayFallback, true);
});

test("empty Payload categories stay empty instead of faking published content", () => {
  assert.deepEqual(fillCategoryStories([], [{ title: "Reserve" }], 7), []);
});

test("a category with some Payload content can fill later empty sections", () => {
  const result = fillCategoryStories([], [{ id: "reserve", slug: "reserve", href: "/artikler/reserve", title: "Reserve" }], 4, {
    allowFallback: true,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].href, undefined);
  assert.equal(result[0].displayFallback, true);
});

test("category template fills all article sections from the same shared layout", () => {
  const source = readFileSync(path.join(rootDir, "src/pages/AiNewspaperPage.jsx"), "utf8");

  assert.match(source, /fillCategoryStories\(payloadStories, normalizedLegacyStories, 7\)/);
  assert.match(source, /fillCategoryStories\(payloadStories\.slice\(3\), normalizedLegacyLatestStories, 11/);
  assert.match(source, /fillCategoryStories\(payloadStories\.slice\(7, 11\), normalizedLegacySecondaryStories, 4/);
});
