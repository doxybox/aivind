import React from "react";
import Link from "next/link";
import { Clock, ExternalLink, PlayCircle } from "lucide-react";
import { withArticleHref } from "@/lib/article-slugs";
import ArticleReactions from "./ArticleReactions";

export default function ArticleCard({ article }) {
  if (!article) return null;
  const isTest = article.type === "test";
  const isSponsored = article.type === "sponsored";
  const isVideo = article.type === "video";
  const isGuide = article.type === "guide";

  const linkedArticle = withArticleHref(article);
  const href = linkedArticle.href || "#";

  return (
    <Link href={href} className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md dark:shadow-none transition-shadow h-full">
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden shrink-0 bg-muted border-b border-border/50">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap max-w-[90%]">
          {!isSponsored ? (
            <span className="inline-block px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">
              {isTest ? 'TESTER' : article.category}
            </span>
          ) : (
            <span className="inline-block px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">
              Sponset
            </span>
          )}

          {isVideo && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">
              <PlayCircle className="w-3 h-3" />
              {article.duration || "Video"}
            </span>
          )}
        </div>

        {/* Test Score Badge */}
        {isTest && article.score && (
          <div className="absolute bottom-2.5 right-2.5 bg-orange-500 text-white flex items-center justify-center w-10 h-10 rounded-full font-black text-[11px] tracking-tighter shadow-lg">
            {article.score}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <h3 className={`text-[15px] sm:text-[16px] font-bold text-foreground leading-snug group-hover:text-orange-500 transition-colors line-clamp-2 sm:line-clamp-3 tracking-[-0.01em] ${isSponsored ? 'text-muted-foreground' : ''}`}>
          {article.title}
        </h3>
        
        <div className="flex-1" />

        {/* Footer / Metadata */}
        <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              {article.author && (
                 <>
                    <span className="font-semibold text-foreground/80 truncate">
                      {isSponsored && <ExternalLink className="w-3 h-3 inline mr-1 sm:mr-1.5 mb-0.5 text-muted-foreground" />}
                      {article.author.split(' ')[0]}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                 </>
              )}
              <span className="whitespace-nowrap shrink-0">{article.time || (article.published_at ? new Date(article.published_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short" }) : "")}</span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {article.readTime && (
                  <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    {article.readTime}
                  </span>
                )}
            </div>
          </div>
          <ArticleReactions article={article} />
        </div>
      </div>
    </Link>
  );
}
