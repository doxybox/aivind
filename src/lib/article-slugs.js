export function slugifyArticleTitle(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function withArticleHref(article = {}) {
  const slug = article.slug || slugifyArticleTitle(article.title || "");
  return {
    ...article,
    slug,
    href: article.href || (slug ? `/artikler/${slug}` : "#"),
  };
}
