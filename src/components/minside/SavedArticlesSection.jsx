import React, { useEffect, useState } from "react";
import { deleteSavedArticle, getSavedArticles } from "@/lib/account-client";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import SectionSkeleton from "./SectionSkeleton";

export default function SavedArticlesSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadArticles = async () => {
    try {
      const data = await getSavedArticles();
      setArticles(data.articles || []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleRemove = async (id) => {
    try {
      await deleteSavedArticle(id);
      setArticles(articles.filter((article) => (article.saved_id || article.id) !== id));
    } catch {
      setLoadFailed(true);
    }
  };

  if (loading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Lagrede artikler</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Artikler du har lagret for senere.</p>
      </div>

      {articles.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed p-10 text-center">
          <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-muted-foreground">
            {loadFailed ? "Kunne ikke hente lagrede artikler" : "Du har ikke lagret noen artikler ennå"}
          </p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">
            {loadFailed ? "Prøv igjen litt senere." : "Trykk på bokmerke-ikonet på artikler for å lagre dem her."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const savedId = article.saved_id || article.id;

            return (
              <div key={savedId} className="article-card bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                {article.article_image && <img src={article.article_image} alt="" className="w-16 h-16 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground line-clamp-1">{article.article_title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    {article.article_category && <span className="text-orange-500 font-semibold">{article.article_category}</span>}
                    {article.article_date && <span>· {new Date(article.article_date).toLocaleDateString("nb-NO")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={article.article_url || "#"} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-orange-500 transition-colors"><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleRemove(savedId)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
