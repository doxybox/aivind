import React from "react";
import { Clock } from "lucide-react";
import HeroArticleCard from "./HeroArticleCard";
import ArticleReactions from "./ArticleReactions";

export default function HeroSection({ heroImage, articles = [] }) {
  return (
    <section className="pt-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main hero card */}
          <div className="lg:col-span-8">
            <div className="relative rounded-xl overflow-hidden group cursor-pointer min-h-[320px] sm:min-h-[420px] lg:min-h-[480px] bg-black">
              {/* Background image */}
              <img
                src={heroImage}
                alt="OpenAI lanserer GPT-4o"
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/80 via-[#0a0a0c]/20 to-transparent" />

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-end h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[480px]">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm mb-4">
                    AI
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover:text-orange-500 transition-colors duration-300 leading-tight tracking-[-0.02em] max-w-2xl mb-4">
                    OpenAI lanserer GPT-4o:<br />
                    Raskere, smartere og mer<br />
                    menneskelig
                  </h1>
                  <p className="text-[15px] sm:text-[17px] text-gray-300 leading-relaxed max-w-lg mb-6 font-medium">
                    Den nye modellen er tilgjengelig for alle – og den<br className="hidden sm:block" />
                    forstår både tekst, bilde og tale i sanntid.
                  </p>
                  
                  {/* Author and metadata */}
                  <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium flex-wrap">
                    <div className="flex items-center gap-2">
                      <img src="/images/placeholders/avatar-placeholder.svg" alt="Martin Berg" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-gray-200">Martin Berg</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span>2 timer siden</span>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>4 min lesetid</span>
                    </div>
                  </div>
                  <ArticleReactions count={142} className="mt-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Latest articles sidebar */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-3 h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[480px]">
              {articles.slice(0, 3).map((article, idx) => (
                <HeroArticleCard key={idx} article={article} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
