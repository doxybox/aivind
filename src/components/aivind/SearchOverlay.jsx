import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchOverlay({ open, onClose, articles = [] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? articles.filter((article) => {
        return (
          (article.title || "").toLowerCase().includes(q) ||
          (article.excerpt || "").toLowerCase().includes(q) ||
          (article.author || article.authorName || "").toLowerCase().includes(q) ||
          (article.category || "").toLowerCase().includes(q)
        );
      })
    : articles;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="search-animate relative w-full max-w-2xl mt-20 mx-4 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sok etter artikler, kategorier, forfattere..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Ingen resultater for "<span className="text-foreground font-medium">{query}</span>"
              </p>
            </div>
          ) : (
            <div className="py-2">
              <p className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {q ? `${results.length} resultat${results.length !== 1 ? "er" : ""}` : "Siste saker"}
              </p>
              {results.map((article, index) => (
                <a
                  key={article.id || article.slug || index}
                  href={article.href || "#"}
                  onClick={onClose}
                  className="search-result-animate flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors group"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <img
                    src={article.image || article.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors line-clamp-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.category} - {article.author || article.authorName || "AIVIND"} - {article.time || "Nylig"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground font-mono">
            Trykk <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] border border-border">ESC</kbd> for a lukke
          </p>
          <p className="text-[11px] text-muted-foreground">
            {articles.length} artikler totalt
          </p>
        </div>
      </div>
    </div>
  );
}
