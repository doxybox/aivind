import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { staffOnly } from "../src/payload/access/roles.js";
import { Articles } from "../src/payload/collections/Articles.js";
import { Authors } from "../src/payload/collections/Authors.js";
import { Categories } from "../src/payload/collections/Categories.js";
import { MediaAssets } from "../src/payload/collections/MediaAssets.js";
import { Reels } from "../src/payload/collections/Reels.js";
import { assertSameOriginRequest } from "../src/lib/server/csrf.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("raw Payload editorial collections are staff-only", () => {
  const anonymousRequest = { user: null };
  const staffRequest = { user: { roles: ["editor"] } };

  assert.equal(staffOnly({ req: anonymousRequest }), false);
  assert.equal(staffOnly({ req: staffRequest }), true);

  for (const collection of [Articles, Authors, Categories, MediaAssets, Reels]) {
    assert.equal(collection.access.read, staffOnly, `${collection.slug} must not expose a public raw API`);
  }
});

test("authenticated mutations require a configured same-origin source", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://staging.tekkno.no" };

  assert.throws(
    () => assertSameOriginRequest({ method: "POST", headers: {} }, { env }),
    (error) => error?.status === 403 && error.message === "Missing request origin",
  );
  assert.throws(
    () => assertSameOriginRequest({ method: "PUT", headers: { origin: "https://attacker.example" } }, { env }),
    (error) => error?.status === 403 && error.message === "Invalid request origin",
  );
  assert.equal(
    assertSameOriginRequest({ method: "POST", headers: { origin: "https://staging.tekkno.no" } }, { env }),
    true,
  );
  assert.equal(assertSameOriginRequest({ method: "GET", headers: {} }, { env }), true);
});

test("identifier login uses configured auth origin instead of request Host or cookies", () => {
  const source = readProjectFile("src/pages/api/auth/sign-in/identifier.js");

  assert.match(source, /getConfiguredAuthOrigin/);
  assert.match(source, /assertSameOriginRequest\(req\)/);
  assert.doesNotMatch(source, /req\.headers\.host/);
  assert.doesNotMatch(source, /Cookie:\s*req\.headers\.cookie/);
});

test("both Next applications define baseline browser security headers", () => {
  const publicConfig = readProjectFile("next.config.js");
  const adminConfig = readProjectFile("payload-admin/next.config.mjs");

  for (const source of [publicConfig, adminConfig]) {
    assert.match(source, /Content-Security-Policy/);
    assert.match(source, /X-Frame-Options/);
    assert.match(source, /X-Content-Type-Options/);
    assert.match(source, /Referrer-Policy/);
  }
});
