import { allArticles } from "@/lib/articles";
import { slugifyArticleTitle, withArticleHref } from "@/lib/article-slugs";

export function getLegacyArticles() {
  return allArticles.map(withArticleHref);
}

export function getLegacyArticleBySlug(slug) {
  if (!slug) return null;

  return getLegacyArticles().find((article) => {
    return article.slug === slug || slugifyArticleTitle(article.title) === slug;
  }) || null;
}
