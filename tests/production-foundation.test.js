import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("rate limiting uses the shared database bucket", () => {
  const limiter = read("src/lib/server/rate-limit.js");
  const schema = read("src/db/schema.js");

  assert.match(limiter, /insert into rate_limit_bucket/);
  assert.match(limiter, /on conflict \(key\) do update/);
  assert.match(schema, /export const rateLimitBucket/);
  assert.doesNotMatch(limiter, /new Map\(/);
});

test("reel analytics avoids a persistent viewer cookie", () => {
  const api = read("src/pages/api/reels/views.js");

  assert.match(api, /createHmac/);
  assert.match(api, /REEL_ANALYTICS_SECRET/);
  assert.doesNotMatch(api, /Set-Cookie/);
  assert.doesNotMatch(api, /tekkno_reel_viewer/);
});

test("maintenance endpoint is secret protected", () => {
  const api = read("src/pages/api/internal/maintenance/analytics.js");

  assert.match(api, /CRON_SECRET/);
  assert.match(api, /timingSafeEqual/);
  assert.match(api, /delete from reel_view/);
  assert.match(api, /delete from rate_limit_bucket/);
});

test("auth waits for transactional email delivery", () => {
  const auth = read("src/lib/auth.js");

  assert.equal((auth.match(/await sendAuthEmail/g) || []).length, 2);
});
