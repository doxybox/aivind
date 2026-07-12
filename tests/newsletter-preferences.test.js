import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  NEWSLETTER_DEFAULTS,
  NewsletterPreferencesValidationError,
  validateNewsletterPreferencesInput,
} from "../src/lib/server/newsletter-preferences-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("newsletter preferences default to safe disabled values", () => {
  assert.deepEqual(NEWSLETTER_DEFAULTS, {
    daily_newsletter: false,
    weekly_summary: false,
    breaking_news: false,
    ai_tech_news: false,
    gaming_news: false,
    offers_subscription_info: false,
  });
});

test("newsletter preferences accept only boolean preference values", () => {
  assert.deepEqual(
    validateNewsletterPreferencesInput({
      daily_newsletter: true,
      weekly_summary: false,
      breaking_news: true,
    }),
    {
      daily_newsletter: true,
      weekly_summary: false,
      breaking_news: true,
    },
  );

  assert.throws(
    () => validateNewsletterPreferencesInput({ daily_newsletter: "true" }),
    NewsletterPreferencesValidationError,
  );
});

test("newsletter preferences reject client supplied user id and unknown fields", () => {
  assert.throws(
    () => validateNewsletterPreferencesInput({ daily_newsletter: true, userId: "other-user" }),
    NewsletterPreferencesValidationError,
  );
  assert.throws(
    () => validateNewsletterPreferencesInput({ daily_newsletter: true, role: "admin" }),
    NewsletterPreferencesValidationError,
  );
});

test("newsletter preference schema is user-scoped", () => {
  const schemaSource = readProjectFile("src/db/schema.js");

  assert.match(schemaSource, /export const newsletterPreference = pgTable\(/);
  assert.match(schemaSource, /"newsletter_preference"/);
  assert.match(schemaSource, /userId:\s*text\("user_id"\)\.notNull\(\)/);
  assert.match(schemaSource, /dailyDigest:\s*boolean\("daily_digest"\)\.notNull\(\)\.default\(false\)/);
  assert.match(schemaSource, /uniqueIndex\("newsletter_preference_user_id_idx"\)\.on\(table\.userId\)/);
});

test("newsletter preference API requires auth and never reads client user id", () => {
  const apiSource = readProjectFile("src/pages/api/account/newsletter-preferences.js");
  const serviceSource = readProjectFile("src/lib/server/account-service.js");

  assert.match(apiSource, /requireAuth\(req\)/);
  assert.match(apiSource, /GET", "POST"/);
  assert.match(apiSource, /getNewsletterPreferencesForUser\(session\.user\)/);
  assert.match(apiSource, /updateNewsletterPreferencesForUser\(session\.user/);
  assert.match(serviceSource, /newsletterPreference\.userId,\s*user\.id/);
});
