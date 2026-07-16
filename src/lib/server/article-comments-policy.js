const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const FORBIDDEN_USER_KEYS = ["userId", "user_id", "authorId", "author_id", "ownerId", "owner_id"];
const MAX_COMMENT_LENGTH = 2000;

export class ArticleCommentValidationError extends Error {
  constructor(message = "Invalid comment") {
    super(message);
    this.name = "ArticleCommentValidationError";
    this.status = 400;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

export function validateArticleCommentSlug(value) {
  const slug = cleanString(value).toLowerCase();
  if (!slug || slug.length > 160 || !ARTICLE_SLUG_PATTERN.test(slug)) {
    throw new ArticleCommentValidationError("Invalid article");
  }
  return slug;
}

export function validateArticleCommentInput(input = {}) {
  if (!isPlainObject(input)) {
    throw new ArticleCommentValidationError("Invalid request");
  }

  if (FORBIDDEN_USER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key))) {
    throw new ArticleCommentValidationError("Do not send user identity from the browser");
  }

  const body = cleanString(input.body || input.comment);
  if (body.length < 2 || body.length > MAX_COMMENT_LENGTH) {
    throw new ArticleCommentValidationError(`Comment must be between 2 and ${MAX_COMMENT_LENGTH} characters`);
  }

  return { body };
}
