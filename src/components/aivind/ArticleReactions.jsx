import React from "react";

export function isVideoArticle(article = {}) {
  const type = String(article.type || "").toLowerCase();
  const category = String(article.category || article.tag || "").toLowerCase();
  return type === "video" || category === "video";
}

export default function ArticleReactions({ article, count, className = "" }) {
  if (isVideoArticle(article)) return null;

  const reactionCount = count ?? article?.reactions ?? article?.comments ?? 0;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-zinc-400 font-medium ${className}`} aria-label={`${reactionCount} reaksjoner`}>
      <span className="text-sm" aria-hidden="true">😲</span>
      <span className="-ml-1.5 text-sm" aria-hidden="true">😂</span>
      <span className="-ml-1.5 text-sm" aria-hidden="true">😍</span>
      <span className="ml-1 text-[#ff6a00]">{reactionCount}</span>
    </div>
  );
}
