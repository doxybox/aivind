import React, { useEffect, useMemo, useState } from "react";
import {
  ARTICLE_REACTIONS,
  emptyReactionCounts,
  getTopArticleReactions,
  normalizeReactionCounts,
} from "@/lib/article-reactions";

const reactionCache = new Map();
const reactionRequests = new Map();

export function isVideoArticle(article = {}) {
  const type = String(article.type || "").toLowerCase();
  const category = String(article.category || article.tag || "").toLowerCase();
  return type === "video" || category === "video";
}

function getArticleSlug(article = {}) {
  if (article.slug) return article.slug;
  const match = String(article.href || "").match(/^\/artikler\/([a-z0-9-]+)$/);
  return match?.[1] || "";
}

async function requestReactionSummary(slug, { force = false } = {}) {
  if (!force && reactionCache.has(slug)) return reactionCache.get(slug);
  if (!force && reactionRequests.has(slug)) return reactionRequests.get(slug);

  const request = fetch(`/api/articles/${encodeURIComponent(slug)}/reactions`, {
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke hente reaksjoner");
      const result = {
        counts: normalizeReactionCounts(data.counts),
        viewerReaction: data.viewerReaction || null,
      };
      reactionCache.set(slug, result);
      return result;
    })
    .finally(() => reactionRequests.delete(slug));

  reactionRequests.set(slug, request);
  return request;
}

export default function ArticleReactions({ article, className = "", interactive = false }) {
  const slug = getArticleSlug(article);
  const [summary, setSummary] = useState(() => ({
    counts: normalizeReactionCounts(article?.reactionCounts || emptyReactionCounts()),
    viewerReaction: null,
  }));
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug || isVideoArticle(article)) return undefined;
    let active = true;

    requestReactionSummary(slug)
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [article, slug]);

  const topReactions = useMemo(() => getTopArticleReactions(summary.counts), [summary.counts]);
  const total = useMemo(
    () => Object.values(summary.counts).reduce((sum, value) => sum + value, 0),
    [summary.counts],
  );

  if (isVideoArticle(article)) return null;

  const react = async (reaction) => {
    if (!interactive || !slug || saving) return;
    setSaving(reaction);
    setError("");

    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reaction }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke lagre reaksjonen");

      const nextSummary = {
        counts: normalizeReactionCounts(data.counts),
        viewerReaction: data.viewerReaction || null,
      };
      reactionCache.set(slug, nextSummary);
      setSummary(nextSummary);
    } catch (reactionError) {
      setError(reactionError.message || "Kunne ikke lagre reaksjonen");
    } finally {
      setSaving("");
    }
  };

  if (interactive) {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2" aria-label="Velg en reaksjon">
          {ARTICLE_REACTIONS.map((reaction) => {
            const selected = summary.viewerReaction === reaction.key;
            return (
              <button
                key={reaction.key}
                type="button"
                onClick={() => react(reaction.key)}
                disabled={Boolean(saving) || !slug}
                aria-label={`${reaction.label}: ${summary.counts[reaction.key]} reaksjoner`}
                aria-pressed={selected}
                title={reaction.label}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "border-[#ff6a00] bg-[#ff6a00]/15 text-[#ff6a00]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-[#ff6a00]/60 dark:border-white/10 dark:bg-[#1e232e] dark:text-zinc-200"
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden="true">{reaction.emoji}</span>
                <span>{summary.counts[reaction.key]}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="mt-2 text-xs font-medium text-red-500" role="status">{error}</p>}
      </div>
    );
  }

  if (topReactions.length === 0) return null;

  return (
    <div className={`flex items-center text-xs text-zinc-400 ${className}`} aria-label={`${total} reaksjoner`}>
      {topReactions.map((reaction, index) => (
        <span
          key={reaction.key}
          className={`text-sm ${index > 0 ? "-ml-1" : ""}`}
          title={`${reaction.label}: ${reaction.count}`}
          aria-hidden="true"
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}
