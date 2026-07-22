import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const readProjectFile = (filePath) => readFileSync(path.join(rootDir, filePath), "utf8");

test("cookie consent keeps advertising opt-in and exposes a withdrawal path", () => {
  const helper = readProjectFile("src/lib/cookie-consent.js");
  const manager = readProjectFile("src/components/aivind/CookieConsentManager.jsx");
  const footer = readProjectFile("src/components/aivind/Footer.jsx");
  const declaration = readProjectFile("src/pages/informasjonskapsler.page.jsx");

  assert.match(helper, /tekkno-cookie-consent/);
  assert.match(helper, /advertising: false/);
  assert.match(helper, /localStorage/);
  assert.match(manager, /Godta alle/);
  assert.match(manager, /Avvis alle/);
  assert.match(manager, /Tilpass valg/);
  assert.match(footer, /Administrer cookies/);
  assert.match(declaration, /Google AdSense/);
  assert.match(declaration, /Administrer cookies/);
});
