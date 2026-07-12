import React from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { withArticleHref } from "@/lib/article-slugs";
import ArticleReactions from "./ArticleReactions";

export default function HeroArticleCard({ article }) {
  const isVideo = article.type === "video";
  const isSponsored = article.type === "sponsored";
  const linkedArticle = withArticleHref(article);

  return (
    <Link href={linkedArticle.href || "#"} className="group relative flex bg-card rounded-xl border border-border overflow-hidden shadow-sm dark:shadow-none flex-1 min-h-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient Overlay to blend image into the card background */}
        <div className="absolute inset-0 bg-gradient-to-r from-card from-20% via-card/80 via-50% to-transparent" />
      </div>

      {/* Text content */}
      <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 w-[85%]">
        <div>
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {!isSponsored ? (
              <span className="inline-block px-2.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                {article.type === "test" ? 'TESTER' : article.category}
              </span>
            ) : (
              <span className="inline-block px-2.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                Sponset
              </span>
            )}
            {isVideo && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                <PlayCircle className="w-3 h-3" />
                {article.duration || "Video"}
              </span>
            )}
          </div>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-foreground leading-snug group-hover:text-orange-500 transition-colors line-clamp-2 tracking-[-0.01em]">
            {article.title}
          </h3>
        </div>
        
        <div className="mt-3 flex items-center justify-start text-[11px] font-medium text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground/80">{article.author ? article.author.split(' ')[0] : "Tekkno"}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{article.time || "Nylig"}</span>
          </div>
          {!isSponsored && <ArticleReactions article={article} className="mt-0" />}
        </div>
      </div>
    </Link>
  );
}
