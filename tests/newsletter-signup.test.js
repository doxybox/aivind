import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  NewsletterSignupValidationError,
  validateNewsletterSignupInput,
} from "../src/lib/server/newsletter-signup-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("newsletter signup normalizes valid email", () => {
  assert.deepEqual(validateNewsletterSignupInput({ email: "  Leser@Tekkno.no " }), {
    email: "leser@tekkno.no",
  });
});

test("newsletter signup rejects invalid email and unknown fields", () => {
  assert.throws(
    () => validateNewsletterSignupInput({ email: "ikke-en-epost" }),
    NewsletterSignupValidationError,
  );
  assert.throws(
    () => validateNewsletterSignupInput({ email: "leser@tekkno.no", userId: "other-user" }),
    NewsletterSignupValidationError,
  );
});

test("public newsletter endpoint is POST-only, rate limited and stores normalized email", () => {
  const apiSource = readProjectFile("src/pages/api/newsletter/subscribe.js");
  const schemaSource = readProjectFile("src/db/schema.js");

  assert.match(apiSource, /req\.method !== "POST"/);
  assert.match(apiSource, /enforceRateLimit\(req, res/);
  assert.match(apiSource, /validateNewsletterSignupInput\(req\.body\)/);
  assert.match(apiSource, /onConflictDoUpdate/);
  assert.match(schemaSource, /"newsletter_subscriber"/);
  assert.match(schemaSource, /uniqueIndex\("newsletter_subscriber_email_idx"\)\.on\(table\.email\)/);
});
