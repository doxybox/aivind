export const ARTICLE_REACTIONS = [
  { key: "fire", emoji: "🔥", label: "Flamme" },
  { key: "love", emoji: "😍", label: "Elsker" },
  { key: "wow", emoji: "😮", label: "Overrasket" },
  { key: "sad", emoji: "😢", label: "Trist" },
  { key: "laugh", emoji: "😂", label: "Ler" },
  { key: "angry", emoji: "😡", label: "Sint" },
];

export const ARTICLE_REACTION_KEYS = ARTICLE_REACTIONS.map((reaction) => reaction.key);

export function emptyReactionCounts() {
  return Object.fromEntries(ARTICLE_REACTION_KEYS.map((key) => [key, 0]));
}

export function normalizeReactionCounts(counts = {}) {
  const normalized = emptyReactionCounts();

  for (const key of ARTICLE_REACTION_KEYS) {
    const value = Number(counts?.[key]);
    normalized[key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  return normalized;
}

export function getTopArticleReactions(counts = {}, limit = 3) {
  const normalized = normalizeReactionCounts(counts);

  return ARTICLE_REACTIONS
    .map((reaction, order) => ({ ...reaction, count: normalized[reaction.key], order }))
    .sort((left, right) => right.count - left.count || left.order - right.order)
    .slice(0, limit);
}

export function validateArticleReactionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw Object.assign(new Error("Ugyldig reaksjon"), { status: 400 });
  }

  const keys = Object.keys(input);
  if (keys.length !== 1 || keys[0] !== "reaction" || !ARTICLE_REACTION_KEYS.includes(input.reaction)) {
    throw Object.assign(new Error("Ugyldig reaksjon"), { status: 400 });
  }

  return { reaction: input.reaction };
}

export function validateArticleReactionSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
    throw Object.assign(new Error("Ugyldig artikkel"), { status: 400 });
  }
  return slug;
}
