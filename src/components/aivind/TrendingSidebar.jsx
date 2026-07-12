import React from "react";
import { TrendingUp, ChevronRight, MessageSquare, Clock } from "lucide-react";
import { trendingArticles } from "@/lib/articles";

export default function TrendingSidebar() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm dark:shadow-none flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-black text-foreground uppercase tracking-wider">Mest lest nå</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {trendingArticles.map((item, i) => (
          <a
            key={i}
            href="#"
            className="trending-item flex items-start gap-3 px-4 py-3.5 group"
          >
            <span className="text-orange-500/80 font-black text-lg mt-0.5 shrink-0 w-5 text-center">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-foreground leading-snug group-hover:text-orange-500 transition-colors line-clamp-2 mb-1.5">
                {item.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="inline-block px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                  {item.type === "test" || item.category.toLowerCase() === "tester" ? "TEST" : item.category}
                </span>
                <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                   {item.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.readTime}
                    </span>
                   )}
                   {item.comments !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.comments}
                    </span>
                   )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer link */}
      <a
        href="#"
        className="flex items-center justify-end gap-1 px-4 py-3 text-orange-500 text-xs font-semibold hover:underline transition-all border-t border-border bg-muted/20"
      >
        Se alle mest leste saker
        <ChevronRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}