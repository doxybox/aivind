import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const readProjectFile = (filePath) => readFileSync(path.join(rootDir, filePath), "utf8");

test("adblock gate is global, blocking, and can be disabled only through configuration", () => {
  const gate = readProjectFile("src/components/aivind/AdblockGate.jsx");
  const app = readProjectFile("src/pages/_app.page.jsx");

  assert.match(gate, /NEXT_PUBLIC_ADBLOCK_GATE_ENABLED !== "false"/);
  assert.match(gate, /adsbox ad-banner ad-unit ad-container ad-placement/);
  assert.match(gate, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
  assert.match(gate, /detectBaitBlock\(\)/);
  assert.match(gate, /detectNetworkBlock\(\)/);
  assert.match(gate, /role="alertdialog"/);
  assert.match(gate, /backdrop-blur-xl/);
  assert.match(gate, /if \(!hasChecked\)/);
  assert.match(gate, /Slå av annonseblokkereren for å fortsette/);
  assert.doesNotMatch(gate, /onClose/);
  assert.match(app, /<AdblockGate \/>/);
});
