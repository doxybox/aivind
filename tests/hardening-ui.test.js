import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateTipSubmissionInput } from "../src/lib/server/tips-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("tips card only shows success after real API success", () => {
  const source = readProjectFile("src/components/minside/cards/TipsOssCard.jsx");

  assert.match(source, /fetch\("\/api\/tips"/);
  assert.match(source, /if \(!response\.ok\) throw new Error/);
  assert.match(source, /setSubmitted\(true\)/);
  assert.match(source, /Bilde og video kommer senere/);
});

test("tips API validates input and stores in Payload tip-submissions", () => {
  const source = readProjectFile("src/pages/api/tips.js");
  const clean = validateTipSubmissionInput({
    title: "Et viktig tips",
    description: "Dette er en reell tipsbeskrivelse.",
    category: "Nyhet",
  });

  assert.equal(clean.title, "Et viktig tips");
  assert.equal(clean.category, "Nyhet");
  assert.throws(() => validateTipSubmissionInput({ title: "x", description: "kort" }), /for kort/);
  assert.match(source, /enforceRateLimit/);
  assert.match(source, /collection: "tip-submissions"/);
  assert.doesNotMatch(source, /userId|client_secret|TOKEN/);
});

test("newsletter card writes through preference API instead of read-only switches", () => {
  const source = readProjectFile("src/components/minside/cards/NewsletterCard.jsx");

  assert.match(source, /getNewsletterPreferences/);
  assert.match(source, /updateNewsletterPreferences/);
  assert.match(source, /onCheckedChange/);
  assert.doesNotMatch(source, /disabled className="data-\[state=checked\]:bg-orange-500 shrink-0"/);
});

test("security card does not show fake password dates or device counts", () => {
  const source = readProjectFile("src/components/minside/cards/SecurityCard.jsx");

  assert.doesNotMatch(source, /12\. januar 2024/);
  assert.doesNotMatch(source, /3 enheter/);
  assert.match(source, /Ikke tilgjengelig enna/);
  assert.match(source, /Enhetsliste er ikke tilgjengelig enna/);
});

test("next config sets basic security headers without enabling broad Base44 rewrites", () => {
  const source = readProjectFile("next.config.js");

  assert.match(source, /async headers\(\)/);
  assert.match(source, /X-Frame-Options/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /Referrer-Policy/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /ALLOW_BASE44_API_REWRITE/);
});
