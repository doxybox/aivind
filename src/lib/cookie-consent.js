export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE_NAME = "tekkno_consent";
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_MAX_AGE_SECONDS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;

export const COOKIE_CONSENT_CHANGE_EVENT = "tekkno:cookie-consent-change";
export const COOKIE_CONSENT_MANAGE_EVENT = "tekkno:cookie-consent-manage";

export const defaultCookieConsent = {
  necessary: true,
  analytics: false,
  advertising: false,
  personalization: false,
  savedAt: null,
  version: CONSENT_VERSION,
  decided: false,
};

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readCookieValue(name) {
  if (!isBrowser()) return null;
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}

export function createCookieConsent(values = {}, now = new Date()) {
  return {
    necessary: true,
    analytics: Boolean(values.analytics),
    advertising: Boolean(values.advertising),
    personalization: Boolean(values.personalization),
    savedAt: now.toISOString(),
    version: CONSENT_VERSION,
    decided: true,
  };
}

export function parseCookieConsent(rawValue, now = new Date()) {
  if (!rawValue || typeof rawValue !== "string") return defaultCookieConsent;

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    const savedAt = new Date(parsed.savedAt);
    const minValidTimestamp = now.getTime() - (CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const maxFutureTimestamp = now.getTime() + (5 * 60 * 1000);

    if (
      parsed.version !== CONSENT_VERSION
      || parsed.necessary !== true
      || typeof parsed.analytics !== "boolean"
      || typeof parsed.advertising !== "boolean"
      || typeof parsed.personalization !== "boolean"
      || Number.isNaN(savedAt.getTime())
      || savedAt.getTime() < minValidTimestamp
      || savedAt.getTime() > maxFutureTimestamp
    ) return defaultCookieConsent;

    return {
      necessary: true,
      analytics: parsed.analytics,
      advertising: parsed.advertising,
      personalization: parsed.personalization,
      savedAt: savedAt.toISOString(),
      version: CONSENT_VERSION,
      decided: true,
    };
  } catch {
    return defaultCookieConsent;
  }
}

export function readCookieConsent() {
  return parseCookieConsent(readCookieValue(CONSENT_COOKIE_NAME));
}

export function saveCookieConsent(values = {}) {
  const consent = createCookieConsent(values);
  if (!isBrowser()) return consent;

  const attributes = [
    `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
  ];
  if (window.location.protocol === "https:") attributes.push("Secure");

  document.cookie = attributes.join("; ");
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: consent }));
  return consent;
}

export function openCookiePreferences() {
  if (isBrowser()) window.dispatchEvent(new Event(COOKIE_CONSENT_MANAGE_EVENT));
}
