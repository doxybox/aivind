import React, { useState } from "react";
import Navbar from "@/components/aivind/Navbar";
import HeroSection from "@/components/aivind/HeroSection";
import ReelsSection from "@/components/aivind/ReelsSection";
import LatestNewsSection from "@/components/aivind/LatestNewsSection";
import CategoryBlock from "@/components/aivind/CategoryBlock";
import Footer from "@/components/aivind/Footer";
import SearchOverlay from "@/components/aivind/SearchOverlay";
import { 
  HERO_IMAGE, 
  allArticles, 
  featuredArticles, 
  latestArticles,
  testArticlesData,
  guideArticlesData,
  gamingArticlesData,
  evArticlesData,
  aiArticlesData
} from "@/lib/articles";
import TrendingSidebar from "@/components/aivind/TrendingSidebar";
import AdSlot from "@/components/aivind/AdSlot";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setSearchOpen(true)} />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        articles={allArticles}
      />

      {/* Top Hero Section */}
      <HeroSection heroImage={HERO_IMAGE} articles={featuredArticles} />

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* News & Trending Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9 order-1">
            {/* Latest News Tabbed Section */}
            <LatestNewsSection articles={latestArticles} />
          </div>
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col order-3 lg:order-2 gap-6">
            <TrendingSidebar />
            {/* Flexible Ad Slot Sidebar */}
            <AdSlot placement="article-sidebar-bottom" className="min-h-[250px] w-full flex-1" fallbackDescription="Annonseplass" />
            <div className="hidden w-full flex-1 bg-border/30 dark:bg-card/30 border border-border/60 rounded-lg flex flex-col items-center justify-center shadow-sm dark:shadow-none relative min-h-[250px]">
               <span className="absolute top-3 right-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ANNONSE</span>
               <span className="text-xl text-muted-foreground/50 font-medium tracking-[0.1em] text-center px-4">REKLAMEPLASS</span>
            </div>
          </div>
        </div>

        {/* Ad Slot Horizontal (970x250) */}
        <AdSlot placement="home-primary" className="mb-12 h-[250px] w-full" fallbackDescription="Annonseplass på forsiden" />
        <div className="hidden w-full bg-border/30 dark:bg-card/30 border border-border/60 rounded-lg flex flex-col items-center justify-center py-14 shadow-sm dark:shadow-none relative mb-12">
           <span className="absolute top-3 right-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ANNONSE</span>
           <span className="text-2xl text-muted-foreground/50 font-medium tracking-[0.1em]">REKLAMEPLASS</span>
           <span className="text-[11px] text-muted-foreground/70 mt-2 font-mono">970 × 250</span>
        </div>

        {/* Categories Blocks */}
        <div className="space-y-12">
          <CategoryBlock title="Tester" articles={testArticlesData} categoryColor="text-orange-500" count={5} columns={5} />
          
          <CategoryBlock title="Guider" articles={guideArticlesData} categoryColor="text-orange-500" count={4} columns={4} />

          <div className="py-4">
             <ReelsSection />
          </div>
          
          <CategoryBlock title="Gaming" articles={gamingArticlesData} categoryColor="text-orange-500" count={5} columns={5} />
          
          <CategoryBlock title="Elbil" articles={evArticlesData} categoryColor="text-orange-500" count={6} columns={3} />
          
          <CategoryBlock title="AI" articles={aiArticlesData} categoryColor="text-orange-500" count={6} columns={3} />
        </div>

      </div>

      <Footer />
    </div>
  );
}
