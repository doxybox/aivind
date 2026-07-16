import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const config = fs.readFileSync(new URL("../payload.config.js", import.meta.url), "utf8");
const articlePage = fs.readFileSync(new URL("../src/pages/artikler/[slug].page.jsx", import.meta.url), "utf8");
const previewRoute = fs.readFileSync(new URL("../src/pages/api/payload-preview.js", import.meta.url), "utf8");
const previewHelper = fs.readFileSync(new URL("../src/lib/server/payload-preview.js", import.meta.url), "utf8");

test("Payload editorial workflow enables dashboard and signed article preview", () => {
  assert.match(config, /livePreview/);
  assert.match(config, /EditorialDashboard/);
  assert.match(config, /createPayloadPreviewToken/);
  assert.match(articlePage, /useLivePreview/);
  assert.match(articlePage, /getArticlePreviewBySlug/);
  assert.match(previewRoute, /verifyPayloadPreviewToken/);
  assert.match(previewRoute, /payload_editorial_preview/);
  assert.match(articlePage, /payload_editorial_preview/);
  assert.match(previewHelper, /timingSafeEqual/);
});
