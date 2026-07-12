function storyKey(story = {}) {
  return String(story.slug || story.title || story.id || "").trim().toLowerCase();
}

export function fillCategoryStories(primaryStories = [], fallbackStories = [], limit = 0, { allowFallback = false } = {}) {
  if (!Array.isArray(primaryStories) || limit <= 0) {
    return Array.isArray(primaryStories) ? primaryStories.slice(0, Math.max(limit, 0)) : [];
  }

  if (primaryStories.length === 0 && !allowFallback) return [];

  const result = primaryStories.slice(0, limit);
  const seen = new Set(result.map(storyKey).filter(Boolean));

  for (const [index, fallbackStory] of fallbackStories.entries()) {
    if (result.length >= limit) break;
    const key = storyKey(fallbackStory);
    if (!key || seen.has(key)) continue;

    const { href: _href, slug: _slug, ...displayStory } = fallbackStory;
    result.push({
      ...displayStory,
      id: `category-display-fallback-${displayStory.id || index + 1}`,
      displayFallback: true,
    });
    seen.add(key);
  }

  return result;
}
