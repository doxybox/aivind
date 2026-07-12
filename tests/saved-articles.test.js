import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  SavedArticleValidationError,
  validateDeleteSavedArticleInput,
  validateSaveArticleInput,
} from "../src/lib/server/saved-articles-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("saved article input accepts Payload slug without userId", () => {
  assert.deepEqual(validateSaveArticleInput({ slug: "payload-artikkel-1" }), {
    articleSlug: "payload-artikkel-1",
    articleId: "",
  });
});

test("saved article input rejects client supplied userId", () => {
  assert.throws(
    () => validateSaveArticleInput({ slug: "payload-artikkel-1", userId: "other-user" }),
    SavedArticleValidationError,
  );
});

test("saved article input requires valid slug or article id", () => {
  assert.throws(() => validateSaveArticleInput({ slug: "../admin" }), SavedArticleValidationError);
  assert.throws(() => validateSaveArticleInput({}), SavedArticleValidationError);
});

test("delete saved article input accepts row id or slug and rejects userId", () => {
  assert.deepEqual(validateDeleteSavedArticleInput({ id: "9f7e84bd-7258-4b27-b292-b2e84d438241" }), {
    id: "9f7e84bd-7258-4b27-b292-b2e84d438241",
    articleSlug: "",
  });
  assert.deepEqual(validateDeleteSavedArticleInput({ slug: "payload-artikkel-1" }), {
    id: "",
    articleSlug: "payload-artikkel-1",
  });
  assert.throws(
    () => validateDeleteSavedArticleInput({ slug: "payload-artikkel-1", user_id: "other-user" }),
    SavedArticleValidationError,
  );
});

test("saved article schema is user-scoped and unique per article", () => {
  const schemaSource = readProjectFile("src/db/schema.js");

  assert.match(schemaSource, /export const savedArticle = pgTable\(/);
  assert.match(schemaSource, /"saved_article"/);
  assert.match(schemaSource, /userId:\s*text\("user_id"\)\.notNull\(\)/);
  assert.match(schemaSource, /articleSlug:\s*text\("article_slug"\)\.notNull\(\)/);
  assert.match(schemaSource, /uniqueIndex\("saved_article_user_id_article_slug_idx"\)\.on\(table\.userId, table\.articleSlug\)/);
});

test("saved article API requires auth and supports GET POST DELETE only", () => {
  const apiSource = readProjectFile("src/pages/api/account/saved-articles.js");

  assert.match(apiSource, /requireAuth\(req\)/);
  assert.match(apiSource, /GET", "POST", "DELETE"/);
  assert.match(apiSource, /saveArticleForUser\(userId/);
  assert.match(apiSource, /deleteSavedArticleForUser\(userId/);
});
