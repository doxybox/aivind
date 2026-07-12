import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  getArticleEntitlementKeys,
  resolveArticleAccess,
} from "../src/lib/server/article-access-core.js";
import { mapPayloadArticleToPageData } from "../src/lib/server/payload-public-data.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

const user = { id: "user-1" };
const premiumArticle = {
  id: 42,
  slug: "premium-sak",
  title: "Premium sak",
  excerpt: "Ingress",
  content: "HEMMELIG PREMIUM FULLTEKST",
  accessLevel: "paid",
  paywallEnabled: true,
};

test("public article is readable by unauthenticated users", () => {
  const access = resolveArticleAccess({
    user: null,
    article: { accessLevel: "public", paywallEnabled: false },
  });

  assert.equal(access.canReadFullBody, true);
  assert.equal(access.reason, "public");
});

test("members article requires login but not premium entitlement", () => {
  const article = { accessLevel: "members", paywallEnabled: false };

  assert.equal(resolveArticleAccess({ user: null, article }).canReadFullBody, false);
  assert.equal(resolveArticleAccess({ user, article }).canReadFullBody, true);
  assert.equal(resolveArticleAccess({ user, article }).reason, "registered_user");
});

test("premium article blocks unauthenticated and logged-in users without entitlement", () => {
  const anonymous = resolveArticleAccess({ user: null, article: premiumArticle });
  const reader = resolveArticleAccess({ user, article: premiumArticle });

  assert.equal(anonymous.canReadFullBody, false);
  assert.equal(anonymous.requiredAction, "login");
  assert.equal(reader.canReadFullBody, false);
  assert.equal(reader.requiredAction, "subscribe");
});

test("active entitlement or subscription grants premium article access", () => {
  const now = new Date("2026-06-29T12:00:00Z");

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      entitlements: [{ type: "premium", active: true, startsAt: null, endsAt: null }],
      now,
    }).canReadFullBody,
    true,
  );

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      hasActiveSubscription: true,
      now,
    }).canReadFullBody,
    true,
  );
});

test("expired or inactive entitlement does not grant premium access", () => {
  const now = new Date("2026-06-29T12:00:00Z");

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      entitlements: [{ type: "premium", active: true, endsAt: new Date("2026-06-01T12:00:00Z") }],
      now,
    }).canReadFullBody,
    false,
  );

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      entitlements: [{ type: "premium", active: false, endsAt: null }],
      now,
    }).canReadFullBody,
    false,
  );
});

test("article-specific entitlement and staff roles grant access", () => {
  assert.deepEqual(getArticleEntitlementKeys(premiumArticle), [
    "premium_article:42",
    "premium_article_slug:premium-sak",
  ]);

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      entitlements: [{ type: "premium_article:42", active: true }],
    }).canReadFullBody,
    true,
  );

  assert.equal(
    resolveArticleAccess({
      user,
      article: premiumArticle,
      roles: ["journalist"],
    }).reason,
    "staff_override",
  );
});

test("premium body is not serialized without access", () => {
  const mapped = mapPayloadArticleToPageData(premiumArticle, { canReadFullBody: false });
  const serialized = JSON.stringify(mapped);

  assert.equal(mapped.body, "");
  assert.equal(mapped.content, "");
  assert.equal(serialized.includes("HEMMELIG PREMIUM FULLTEKST"), false);
  assert.equal(serialized.includes("Ingress"), true);
});

test("article route uses server-side article access helper", () => {
  const routeSource = readProjectFile("src/pages/artikler/[slug].page.jsx");

  assert.match(routeSource, /getArticleAccessForUser/);
  assert.match(routeSource, /viewerAccess\.canReadFullBody/);
  assert.doesNotMatch(routeSource, /canAccessPremiumArticle/);
});

test("dev entitlement grant tool is not open in production", () => {
  const script = readProjectFile("scripts/grant-test-entitlement.js");
  const packageJson = JSON.parse(readProjectFile("package.json"));

  assert.match(script, /NODE_ENV === "production"/);
  assert.match(script, /ALLOW_TEST_ENTITLEMENT_GRANT !== "true"/);
  assert.match(script, /source: "test_seed"/);
  assert.equal(packageJson.scripts["auth:grant-test-entitlement"], "node scripts/grant-test-entitlement.js");
});
