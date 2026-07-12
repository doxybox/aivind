import React from "react";
import ArticleCard from "./ArticleCard";
import { ChevronRight } from "lucide-react";

export default function CategoryBlock({ title, articles, categoryColor = "text-orange-500", link = "#", count = 4, columns = 4 }) {
  if (!articles || articles.length === 0) return null;

  const displayArticles = articles.length > 0 
    ? Array.from({ length: count }, (_, i) => articles[i % articles.length]) 
    : [];

  const gridClass = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6"
  }[columns] || "lg:grid-cols-4";

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          {title}
        </h2>
        <a href={link} className={`text-sm font-semibold flex items-center gap-1 hover:underline ${categoryColor}`}>
          Se alle <ChevronRight className="w-4 h-4" />
        </a>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridClass} gap-5`}>
        {displayArticles.map((article, idx) => (
          <ArticleCard key={idx} article={article} />
        ))}
      </div>
    </div>
  );
}