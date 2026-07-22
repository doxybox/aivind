export const COOKIE_CONSENT_STORAGE_KEY = "tekkno-cookie-consent";
export const COOKIE_CONSENT_CHANGE_EVENT = "tekkno:cookie-consent-change";
export const COOKIE_CONSENT_MANAGE_EVENT = "tekkno:cookie-consent-manage";

const CONSENT_VERSION = 1;

export const defaultCookieConsent = {
  necessary: true,
  advertising: false,
  decided: false,
  updatedAt: null,
  version: CONSENT_VERSION,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readCookieConsent() {
  if (!isBrowser()) return defaultCookieConsent;

  try {
    const stored = JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) || "null");
    if (!stored || stored.version !== CONSENT_VERSION || typeof stored.advertising !== "boolean") {
      return defaultCookieConsent;
    }

    return {
      necessary: true,
      advertising: stored.advertising,
      decided: true,
      updatedAt: stored.updatedAt || null,
      version: CONSENT_VERSION,
    };
  } catch {
    return defaultCookieConsent;
  }
}

export function saveCookieConsent({ advertising = false } = {}) {
  const consent = {
    necessary: true,
    advertising: Boolean(advertising),
    decided: true,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  if (!isBrowser()) return consent;

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: consent }));
  return consent;
}

export function openCookiePreferences() {
  if (isBrowser()) window.dispatchEvent(new Event(COOKIE_CONSENT_MANAGE_EVENT));
}
