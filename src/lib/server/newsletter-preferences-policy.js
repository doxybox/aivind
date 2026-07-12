const NEWSLETTER_KEYS = [
  "daily_newsletter",
  "weekly_summary",
  "breaking_news",
  "ai_tech_news",
  "gaming_news",
  "offers_subscription_info",
];

const FORBIDDEN_USER_KEYS = ["userId", "user_id", "ownerId", "owner_id"];

export const NEWSLETTER_DEFAULTS = {
  daily_newsletter: false,
  weekly_summary: false,
  breaking_news: false,
  ai_tech_news: false,
  gaming_news: false,
  offers_subscription_info: false,
};

export class NewsletterPreferencesValidationError extends Error {
  constructor(message = "Invalid newsletter preferences input") {
    super(message);
    this.name = "NewsletterPreferencesValidationError";
    this.status = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasForbiddenUserInput(input) {
  return FORBIDDEN_USER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

export function validateNewsletterPreferencesInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new NewsletterPreferencesValidationError("Invalid newsletter preferences payload");
  }

  if (hasForbiddenUserInput(input)) {
    throw new NewsletterPreferencesValidationError("Do not send userId for newsletter preferences");
  }

  const allowed = new Set(NEWSLETTER_KEYS);
  const clean = {};

  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) {
      throw new NewsletterPreferencesValidationError(`Invalid newsletter preference field: ${key}`);
    }

    if (typeof value !== "boolean") {
      throw new NewsletterPreferencesValidationError(`Newsletter preference must be boolean: ${key}`);
    }

    clean[key] = value;
  }

  return clean;
}
