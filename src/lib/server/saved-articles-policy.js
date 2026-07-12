const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const ARTICLE_ID_PATTERN = /^[a-zA-Z0-9:_-]{1,160}$/;

const FORBIDDEN_USER_KEYS = ["userId", "user_id", "ownerId", "owner_id"];

export class SavedArticleValidationError extends Error {
  constructor(message = "Invalid saved article input") {
    super(message);
    this.name = "SavedArticleValidationError";
    this.status = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasForbiddenUserInput(input) {
  return FORBIDDEN_USER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function cleanString(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

export function validateArticleSlug(value) {
  const slug = cleanString(value);
  if (!slug || slug.length > 160 || !ARTICLE_SLUG_PATTERN.test(slug)) return "";
  return slug.toLowerCase();
}

export function validateArticleId(value) {
  const id = cleanString(value);
  if (!id || !ARTICLE_ID_PATTERN.test(id)) return "";
  return id;
}

export function validateSaveArticleInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new SavedArticleValidationError("Invalid request body");
  }

  if (hasForbiddenUserInput(input)) {
    throw new SavedArticleValidationError("Do not send userId for saved articles");
  }

  const articleSlug = validateArticleSlug(input.articleSlug || input.article_slug || input.slug);
  const articleId = validateArticleId(input.articleId || input.article_id || input.id);

  if (!articleSlug && !articleId) {
    throw new SavedArticleValidationError("Missing article slug or id");
  }

  return {
    articleSlug,
    articleId,
  };
}

export function validateDeleteSavedArticleInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new SavedArticleValidationError("Invalid request");
  }

  if (hasForbiddenUserInput(input)) {
    throw new SavedArticleValidationError("Do not send userId for saved articles");
  }

  const id = validateArticleId(input.id || input.savedArticleId || input.saved_article_id);
  const articleSlug = validateArticleSlug(input.articleSlug || input.article_slug || input.slug);

  if (!id && !articleSlug) {
    throw new SavedArticleValidationError("Missing saved article id or slug");
  }

  return {
    id,
    articleSlug,
  };
}
