import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("Payload editorial validation returns field-specific errors instead of generic failures", () => {
  const articles = readProjectFile("src/payload/collections/Articles.js");
  const subscriptionPlans = readProjectFile("src/payload/collections/SubscriptionPlans.js");

  assert.match(articles, /import \{ ValidationError \} from "payload"/);
  assert.match(articles, /collection: "articles"/);
  assert.match(articles, /Legg inn en tittel før publisering/);
  assert.match(articles, /Velg minst én forfatter før publisering/);
  assert.doesNotMatch(articles, /throw new Error\(/);

  assert.match(subscriptionPlans, /import \{ ValidationError \} from "payload"/);
  assert.match(subscriptionPlans, /collection: "subscription-plans"/);
  assert.match(subscriptionPlans, /Plan-nøkkelen kan ikke endres etter opprettelse/);
  assert.match(subscriptionPlans, /Faktureringsperioden kan ikke endres etter opprettelse/);
  assert.doesNotMatch(subscriptionPlans, /throw new Error\(/);
});
