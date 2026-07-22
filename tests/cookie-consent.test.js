import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
  createCookieConsent,
  defaultCookieConsent,
  parseCookieConsent,
} from "../src/lib/cookie-consent.js";
import { getGoogleConsentState } from "../src/lib/google-consent.js";

const rootDir = process.cwd();
const readProjectFile = (filePath) => readFileSync(path.join(rootDir, filePath), "utf8");
const now = new Date("2026-07-22T12:00:00.000Z");

test("consent accepts valid choices and keeps all category values", () => {
  const accepted = createCookieConsent({ analytics: true, advertising: true, personalization: true }, now);
  const rejected = createCookieConsent({}, now);
  const custom = createCookieConsent({ analytics: true }, now);

  assert.equal(parseCookieConsent(encodeURIComponent(JSON.stringify(accepted)), now).advertising, true);
  assert.deepEqual(parseCookieConsent(encodeURIComponent(JSON.stringify(rejected)), now), rejected);
  assert.equal(parseCookieConsent(encodeURIComponent(JSON.stringify(custom)), now).analytics, true);
  assert.equal(parseCookieConsent(encodeURIComponent(JSON.stringify(custom)), now).advertising, false);
});

test("invalid, expired and old-version consent values are treated as no choice", () => {
  const expiredDate = new Date(now.getTime() - ((CONSENT_MAX_AGE_DAYS + 1) * 24 * 60 * 60 * 1000));
  const expired = createCookieConsent({ advertising: true }, expiredDate);
  const oldVersion = { ...createCookieConsent({ advertising: true }, now), version: CONSENT_VERSION - 1 };

  assert.deepEqual(parseCookieConsent("not-json", now), defaultCookieConsent);
  assert.deepEqual(parseCookieConsent(encodeURIComponent(JSON.stringify(expired)), now), defaultCookieConsent);
  assert.deepEqual(parseCookieConsent(encodeURIComponent(JSON.stringify(oldVersion)), now), defaultCookieConsent);
});

test("Google Consent Mode maps accepted and rejected categories safely", () => {
  assert.deepEqual(getGoogleConsentState({}), {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  assert.deepEqual(getGoogleConsentState({ analytics: true, advertising: true, personalization: true }), {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
});

test("consent UI uses a versioned first-party cookie, provider and accessible withdrawal path", () => {
  const helper = readProjectFile("src/lib/cookie-consent.js");
  const provider = readProjectFile("src/components/aivind/ConsentProvider.jsx");
  const manager = readProjectFile("src/components/aivind/CookieConsentManager.jsx");
  const footer = readProjectFile("src/components/aivind/Footer.jsx");
  const app = readProjectFile("src/pages/_app.page.jsx");
  const slot = readProjectFile("src/components/aivind/AdSlot.jsx");

  assert.match(helper, /tekkno_consent/);
  assert.match(helper, /SameSite=Lax/);
  assert.match(helper, /Max-Age=/);
  assert.match(helper, /Secure/);
  assert.doesNotMatch(helper, /localStorage/);
  assert.match(provider, /consentReady/);
  assert.match(manager, /role="dialog"/);
  assert.match(manager, /Godta alle/);
  assert.match(manager, /Avvis alle/);
  assert.match(manager, /Tilpass valg/);
  assert.match(manager, /Personalisering/);
  assert.match(footer, /Personvernvalg/);
  assert.match(app, /GOOGLE_CONSENT_DEFAULT_SCRIPT/);
  assert.match(slot, /consentReady/);
});
