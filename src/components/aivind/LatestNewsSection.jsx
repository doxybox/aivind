import React, { useState } from "react";
import ArticleCard from "./ArticleCard";

export default function LatestNewsSection({ articles }) {
  const [activeTab, setActiveTab] = useState("Siste");
  const tabs = ["Siste", "Populært", "Mest kommentert"];

  // Fyller opp til nøyaktig 12 artikler ved å repetere hvis det er færre
  const displayArticles = articles?.length > 0 
    ? Array.from({ length: 12 }, (_, i) => articles[i % articles.length]) 
    : [];

  return (
    <section className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h2 className="text-2xl font-bold text-foreground tracking-[-0.02em]">Siste nytt</h2>
        
        {/* Tabs */}
        <div className="flex items-center p-1 bg-muted/60 rounded-full self-start sm:self-auto border border-border/50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-orange-500 text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of latest articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayArticles.map((article, idx) => (
          <ArticleCard key={idx} article={article} />
        ))}
      </div>
    </section>
  );
}