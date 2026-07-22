import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Menu, TrendingUp, TrendingDown, Moon, X, Loader2 } from "lucide-react";
import { GiFlashGrenade } from "react-icons/gi";
import { FaMicrosoft } from "react-icons/fa";
import { SiApple, SiNvidia, SiTesla } from "react-icons/si";
import { useTheme } from "@/hooks/useTheme";
import SearchOverlay from "@/components/aivind/SearchOverlay";
import { allArticles } from "@/lib/articles";
import { withArticleHref } from "@/lib/article-slugs";
import Footer from "@/components/aivind/Footer";
import { categoryNavItems } from "@/components/aivind/categoryNav";
import ReelsSection from "@/components/aivind/ReelsSection";
import PremiumArticleBadge from "@/components/aivind/PremiumArticleBadge";
import BrandLogo from "@/components/aivind/BrandLogo";
import HeaderAccountMenu from "@/components/aivind/HeaderAccountMenu";
import AdSlot from "@/components/aivind/AdSlot";

const GridCard = ({ image, type, accessLevel, paywallEnabled, title, href = "#", className, titleClass = "text-xl md:text-2xl" }) => (
  <Link href={href} className={`group relative rounded-xl overflow-hidden cursor-pointer ${className}`}>
    <div 
      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
      style={{ backgroundImage: `url(${image})` }} 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-[#161a22]/60 to-transparent opacity-90" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-transparent to-transparent opacity-80" />
    <PremiumArticleBadge article={{ type, accessLevel, paywallEnabled }} corner />

    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-start z-10">
      <h3 className={`font-bold text-white leading-[1.2] ${titleClass}`}>
        {title}
      </h3>
    </div>
  </Link>
);

const StockLogo = ({ stock }) => {
  const [failed, setFailed] = useState(false);
  const fallbackLabel = (stock.id || stock.name || "?").slice(0, 2).toUpperCase();
  const brandLogos = {
    nvda: { Icon: SiNvidia, className: "text-[#76b900]" },
    msft: { Icon: FaMicrosoft, className: "text-[#00a4ef]" },
    tsla: { Icon: SiTesla, className: "text-[#e82127]" },
    aapl: { Icon: SiApple, className: "text-zinc-900 dark:text-white" },
  };
  const brandLogo = brandLogos[stock.id];

  if (brandLogo) {
    const { Icon, className } = brandLogo;
    return (
      <span className={`w-full h-full rounded-md bg-zinc-100 dark:bg-white/10 flex items-center justify-center ${className}`} aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
    );
  }

  if (!stock.logo || failed) {
    return (
      <span className="w-full h-full rounded-md bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-zinc-700 dark:text-white">
        {fallbackLabel}
      </span>
    );
  }

  return (
    <Image
      src={stock.logo}
      alt={stock.name}
      width={40}
      height={40}
      unoptimized
      className="w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
};

const LiveStockWidget = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asOf, setAsOf] = useState(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [delayedMinutes, setDelayedMinutes] = useState(15);

  const fetchStocks = async () => {
    setError("");
    try {
      const response = await fetch("/api/market/quotes");
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.stocks)) {
        throw new Error(data.error || "Kunne ikke hente kurser");
      }

      setStocks([...data.stocks].sort((a, b) => b.price - a.price));
      setAsOf(data.asOf || null);
      setMarketOpen(data.marketOpen === true);
      setDelayedMinutes(Number(data.delayedMinutes) || 15);
    } catch (e) {
      setStocks([]);
      setError(e.message || "Kunne ikke hente kurser");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchStocks();
    };
    const interval = setInterval(refreshWhenVisible, 2 * 60 * 1000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  if (loading && stocks.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (error && stocks.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-start justify-center py-8">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Kursene er midlertidig utilgjengelige.</p>
        <button type="button" onClick={fetchStocks} className="mt-3 text-xs font-bold text-[#ff6a00] hover:underline">
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 relative">
      {stocks.map((stock) => {
        const changePercent = Number(stock.changePercent ?? stock.change ?? 0);
        const isPositive = changePercent >= 0;
        
        return (
          <motion.div 
            key={stock.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 py-3 group cursor-pointer border-b border-zinc-100 dark:border-white/5 last:border-0"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <StockLogo stock={stock} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-white text-sm truncate">{stock.name}</span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-sm font-medium transition-colors duration-300 text-zinc-900 dark:text-white">
                {stock.price.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {stock.currency || "NOK"}
              </span>
              <div className={`flex items-center gap-1 text-xs font-bold transition-colors duration-300 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}
      <p className="mt-4 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400">
        {marketOpen ? "" : "Markedet er stengt. "}Kurser kan være forsinket med minst {delayedMinutes} minutter.
        {asOf
          ? ` Sist oppdatert ${new Date(asOf).toLocaleString("nb-NO", {
              weekday: marketOpen ? undefined : "short",
              day: marketOpen ? undefined : "numeric",
              month: marketOpen ? undefined : "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Oslo",
            })}`
          : ""}
      </p>
    </div>
  );
};

export default function NyFrontside1({ payloadHomepageContent = null }) {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const payloadArticles = payloadHomepageContent?.articles || [];
  const payloadFrontpageSlots = payloadHomepageContent?.frontpageSlots || [];
  const payloadReels = payloadHomepageContent?.reels || [];
  const heroSlotArticle = payloadFrontpageSlots.find(
    (slot) => slot.placement === "hero" && slot.article,
  )?.article;
  const orderedPayloadArticles = heroSlotArticle
    ? [
        heroSlotArticle,
        ...payloadArticles.filter((article) => String(article.id) !== String(heroSlotArticle.id)),
      ]
    : payloadArticles;
  const uniquePayloadArticles = orderedPayloadArticles.filter(
    (article, index, articles) => article?.id && articles.findIndex((candidate) => String(candidate.id) === String(article.id)) === index,
  );
  const legacyArticleCards = allArticles.map(withArticleHref);
  const contentArticles = [
    ...uniquePayloadArticles,
    ...legacyArticleCards.filter((legacyArticle) => !uniquePayloadArticles.some((payloadArticle) => payloadArticle.slug === legacyArticle.slug)),
  ];
  const searchArticles = contentArticles.length > 0 ? contentArticles : allArticles;
  const hasContentArticles = contentArticles.length > 0;
  const toCard = (article, fallback = {}) => ({
    id: article?.id || fallback.id,
    slug: article?.slug || fallback.slug,
    image: article?.image || article?.imageUrl || fallback.image || "/images/placeholders/article-placeholder.svg",
    tag: article?.category || article?.tag || fallback.tag || "Nyheter",
    title: article?.title || fallback.title || "Uten tittel",
    href: article?.href || fallback.href || "#",
    type: article?.type || fallback.type,
    accessLevel: article?.accessLevel || fallback.accessLevel,
    paywallEnabled: article?.paywallEnabled ?? fallback.paywallEnabled ?? false,
    reactions: article?.comments ?? article?.reactions ?? fallback.reactions ?? 0,
  });
  const payloadCard = (index, fallback) => {
    return toCard(contentArticles[index], fallback);
  };
  const topHero = payloadCard(0, {
    image: "/images/placeholders/article-placeholder.svg",
    tag: "Tester",
    title: "Neste generasjon VR er her",
  });
  const topSideCards = [
    payloadCard(1, { image: "/images/placeholders/article-placeholder.svg", tag: "Gaming", title: "Elden-ring moter Skyrim i nytt episk action-RPG", reactions: 56 }),
    payloadCard(2, { image: "/images/placeholders/article-placeholder.svg", tag: "Video", type: "video", title: "Regissoren hinter om Matrix 5", reactions: 31 }),
  ];
  const middleCards = [
    payloadCard(3, { image: "/images/placeholders/article-placeholder.svg", tag: "Gadgets", title: "Nye flagship-telefoner" }),
    payloadCard(4, { image: "/images/placeholders/article-placeholder.svg", tag: "Elbil", title: "Ny elbil med 700 km rekkevidde" }),
    payloadCard(5, { image: "/images/placeholders/article-placeholder.svg", tag: "Guider", title: "Smarte hjem som faktisk fungerer" }),
  ];
  const bottomFeature = payloadCard(6, {
    image: "/images/placeholders/article-placeholder.svg",
    tag: "Video",
    title: "Streamingkrigen tilspisser seg",
  });
  const bottomSideCards = [
    payloadCard(7, { image: "/images/placeholders/article-placeholder.svg", tag: "AI", title: "Ny AI-brikke kan endre datakraft", reactions: 18 }),
    payloadCard(8, { image: "/images/placeholders/article-placeholder.svg", tag: "Tester", title: "Test: De beste treningsklokkene", reactions: 24 }),
  ];
  const latestCards = [
    payloadCard(9, { image: "/images/placeholders/article-placeholder.svg", tag: "Gaming", title: "Slik bygger du den ultimate gaming-PCen" }),
    payloadCard(10, { image: "/images/placeholders/article-placeholder.svg", tag: "Guider", title: "Passord er snart historie - slik fungerer passkeys" }),
    payloadCard(11, { image: "/images/placeholders/article-placeholder.svg", tag: "AI", title: "TikToks nye algoritme endrer alt for innholdsskapere" }),
    payloadCard(12, { image: "/images/placeholders/article-placeholder.svg", tag: "Gadgets", title: "Derfor kjoper alle gamle digitalkameraer igjen" }),
    payloadCard(13, { image: "/images/placeholders/article-placeholder.svg", tag: "Guider", title: "De mest etterspurte programmeringssprakene i ar" }),
    payloadCard(14, { image: "/images/placeholders/article-placeholder.svg", tag: "Tester", title: "Vi har testet de nye stoyreduserende hodetelefonene" }),
    payloadCard(15, { image: "/images/placeholders/article-placeholder.svg", tag: "Gadgets", title: "Alt vi vet om den neste store Windows-oppdateringen" }),
    payloadCard(16, { image: "/images/placeholders/article-placeholder.svg", tag: "AI", title: "Slik bruker du AI for a effektivisere hverdagen" }),
  ];
  const additionalArticleRowsBeforeAd = [
    { gridClass: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4", cardClass: "min-h-[240px]", articles: contentArticles.slice(17, 21) },
    { gridClass: "grid-cols-1 md:grid-cols-3", cardClass: "min-h-[280px]", articles: contentArticles.slice(21, 24) },
  ];
  const additionalArticleRowsAfterAd = [
    { gridClass: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4", cardClass: "min-h-[240px]", articles: contentArticles.slice(24, 28) },
    { gridClass: "grid-cols-1 md:grid-cols-3", cardClass: "min-h-[280px]", articles: contentArticles.slice(28, 31) },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#161a22] text-zinc-900 dark:text-white font-sans selection:bg-[#ff6a00] selection:text-white transition-colors duration-300">
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} articles={searchArticles} />
      
      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`absolute top-0 right-0 bottom-0 w-64 bg-white dark:bg-[#161a22] border-l border-zinc-200 dark:border-white/10 p-6 flex flex-col transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-8">
            <span className="text-zinc-900 dark:text-white font-black text-xl tracking-tighter uppercase">MENY</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {categoryNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-zinc-200 dark:bg-white/10 w-full my-2" />
            <HeaderAccountMenu mobile onNavigate={() => setIsMenuOpen(false)} />
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 bg-white dark:bg-[#161a22] border-b border-zinc-200 dark:border-white/5 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0" aria-label="TEKKNO forside">
            <BrandLogo className="h-10 max-w-[172px]" priority />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            {categoryNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          <HeaderAccountMenu />
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <button onClick={toggleTheme} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              {theme === 'dark' ? <GiFlashGrenade className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-zinc-900 dark:hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
            <button onClick={() => setIsMenuOpen(true)} className="hover:text-zinc-900 dark:hover:text-white transition-colors lg:hidden"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto p-4 md:p-6 pb-20">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <GridCard
            className="lg:col-span-2 min-h-[400px] lg:min-h-[500px]"
            image={topHero.image}
            tag={topHero.tag}
            type={topHero.type}
            accessLevel={topHero.accessLevel}
            paywallEnabled={topHero.paywallEnabled}
            title={topHero.title}
            titleClass="text-3xl md:text-5xl lg:text-[56px] font-black tracking-tight"
            href={topHero.href}
          />
          <div className="flex flex-col gap-4">
            {topSideCards.map((card, index) => (
              <GridCard
                key={`${card.title}-${index}`}
                className="flex-1 min-h-[240px]"
                image={card.image}
                tag={card.tag}
                type={card.type}
                accessLevel={card.accessLevel}
                paywallEnabled={card.paywallEnabled}
                title={card.title}
                href={card.href}
                titleClass="text-xl md:text-2xl"
              />
            ))}
          </div>
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {middleCards.map((card, index) => (
            <GridCard
              key={`${card.title}-${index}`}
              className="min-h-[280px]"
              image={card.image}
              tag={card.tag}
              type={card.type}
              accessLevel={card.accessLevel}
              paywallEnabled={card.paywallEnabled}
              title={card.title}
              href={card.href}
            />
          ))}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <GridCard
            className="lg:col-span-2 min-h-[380px]"
            image={bottomFeature.image}
            tag={bottomFeature.tag}
            type={bottomFeature.type}
            accessLevel={bottomFeature.accessLevel}
            paywallEnabled={bottomFeature.paywallEnabled}
            title={bottomFeature.title}
            titleClass="text-2xl md:text-4xl lg:text-[40px] font-black tracking-tight"
            href={bottomFeature.href}
          />
          <div className="flex flex-col gap-4">
            {bottomSideCards.map((card, index) => (
              <GridCard
                key={`${card.title}-${index}`}
                className="flex-1 min-h-[180px]"
                image={card.image}
                tag={card.tag}
                type={card.type}
                accessLevel={card.accessLevel}
                paywallEnabled={card.paywallEnabled}
                title={card.title}
                href={card.href}
                titleClass="text-lg md:text-xl"
              />
            ))}
          </div>

          {/* Tech Aksjer */}
          <div className="bg-white dark:bg-[#1e232e] rounded-xl p-6 border border-zinc-200 dark:border-white/5 flex flex-col h-full transition-colors duration-300">
            <h3 className="text-[#ff6a00] font-bold text-sm tracking-widest uppercase mb-4">Tech Aksjer</h3>
            <div className="flex flex-col flex-1">
              <LiveStockWidget />
            </div>
          </div>
        </div>

        <ReelsSection items={payloadReels.length > 0 ? payloadReels : undefined} />

        {hasContentArticles && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#ff6a00] text-[13px] font-black uppercase tracking-[0.25em]">Siste saker</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestCards.map((article, index) => (
                <GridCard
                  key={article.id || article.slug || article.title || index}
                  className="min-h-[240px]"
                  image={article.image}
                  tag={article.category}
                  type={article.type}
                  accessLevel={article.accessLevel}
                  paywallEnabled={article.paywallEnabled}
                  title={article.title}
                  href={article.href}
                />
              ))}
            </div>
          </section>
        )}

        <AdSlot placement="home-primary" className="mx-auto mb-6 h-[250px] w-full" fallbackDescription="Annonseplass på forsiden" />
        <div className="hidden w-full mx-auto h-[250px] bg-[#161a22] border border-[#ff6a00]/40 shadow-[0_0_15px_rgba(255,106,0,0.1)] rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)', backgroundSize: '16px 16px', WebkitMaskImage: 'linear-gradient(to right, black, transparent)', maskImage: 'linear-gradient(to right, black, transparent)' }} />
          <div className="absolute top-0 right-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)', backgroundSize: '16px 16px', WebkitMaskImage: 'linear-gradient(to left, black, transparent)', maskImage: 'linear-gradient(to left, black, transparent)' }} />
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl border-[2px] border-[#ff6a00] flex items-center justify-center bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-xl md:text-2xl font-bold text-[#ff6a00] tracking-tight">Google Ads 970×250</h3>
              <p className="text-sm md:text-base text-zinc-400 font-medium mt-0.5">Best plassering på forsiden</p>
            </div>
          </div>
        </div>

        {additionalArticleRowsBeforeAd.map((row, rowIndex) => (
          row.articles.length > 1 && (
            <div key={`before-ad-${rowIndex}`} className={`grid ${row.gridClass} gap-4 mb-6`}>
              {row.articles.map((article, articleIndex) => {
                const card = toCard(article);

                return (
                  <GridCard
                    key={card.id || card.slug || `${card.title}-${articleIndex}`}
                    className={row.cardClass}
                    image={card.image}
                    tag={card.tag}
                    type={card.type}
                    accessLevel={card.accessLevel}
                    paywallEnabled={card.paywallEnabled}
                    title={card.title}
                    href={card.href}
                  />
                );
              })}
            </div>
          )
        ))}

        {!hasContentArticles && (
          <>
        {/* Flere Artikler (Rad 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gaming"
            title="Slik bygger du den ultimate gaming-PCen"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Guider"
            title="Passord er snart historie – slik fungerer passkeys"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="TikToks nye algoritme endrer alt for innholdsskapere"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gadgets"
            title="Derfor kjøper alle gamle digitalkameraer igjen"
          />
        </div>

        {/* Flere Artikler (Rad 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Guider"
            title="De mest etterspurte programmeringsspråkene i år"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Tester"
            title="Vi har testet de nye støyreduserende hodetelefonene"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gadgets"
            title="Alt vi vet om den neste store Windows-oppdateringen"
          />
        </div>

        {/* Flere Artikler (Rad 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Slik bruker du AI for å effektivisere hverdagen"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gaming"
            title="Nye spillutgivelser du ikke kan gå glipp av"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Guider"
            title="Webutvikling i 2024: Hva er nytt?"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Big Data: Hvordan selskaper bruker informasjonen din"
          />
        </div>

        {/* Flere Artikler (Rad 4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Guider"
            title="VPN-tjenester: Trenger du det egentlig i 2024?"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gadgets"
            title="Apple Vision Pro vs Meta Quest 3"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Når tar robotene over husarbeidet?"
          />
        </div>

          </>
        )}

        <AdSlot placement="home-secondary" className="mx-auto mb-6 mt-8 h-[250px] w-full" fallbackDescription="Annonseplass i bunn av forsiden" />
        <div className="hidden w-full mx-auto h-[250px] bg-[#161a22] border border-[#ff6a00]/40 shadow-[0_0_15px_rgba(255,106,0,0.1)] rounded-xl mt-8 mb-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)', backgroundSize: '16px 16px', WebkitMaskImage: 'linear-gradient(to right, black, transparent)', maskImage: 'linear-gradient(to right, black, transparent)' }} />
          <div className="absolute top-0 right-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)', backgroundSize: '16px 16px', WebkitMaskImage: 'linear-gradient(to left, black, transparent)', maskImage: 'linear-gradient(to left, black, transparent)' }} />
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl border-[2px] border-[#ff6a00] flex items-center justify-center bg-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-xl md:text-2xl font-bold text-[#ff6a00] tracking-tight">Google Ads 970×250</h3>
              <p className="text-sm md:text-base text-zinc-400 font-medium mt-0.5">Plassering i bunn av siden</p>
            </div>
          </div>
        </div>

        {additionalArticleRowsAfterAd.map((row, rowIndex) => (
          row.articles.length > 1 && (
            <div key={`after-ad-${rowIndex}`} className={`grid ${row.gridClass} gap-4 mb-6`}>
              {row.articles.map((article, articleIndex) => {
                const card = toCard(article);

                return (
                  <GridCard
                    key={card.id || card.slug || `${card.title}-${articleIndex}`}
                    className={row.cardClass}
                    image={card.image}
                    tag={card.tag}
                    type={card.type}
                    accessLevel={card.accessLevel}
                    paywallEnabled={card.paywallEnabled}
                    title={card.title}
                    href={card.href}
                  />
                );
              })}
            </div>
          )
        ))}

        {!hasContentArticles && (
          <>
        {/* Flere Artikler (Rad 5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Guider"
            title="Fremtiden for lagring: Hva betyr det for deg?"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Slik fungerer kvantedatamaskiner"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Trenger vi webdesignere når vi har AI?"
          />
          <GridCard 
            className="min-h-[240px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Dette er fremtidens jobbmarked"
          />
        </div>

        {/* Flere Artikler (Rad 6) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Hvordan startups overlever i 2024"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="AI"
            title="Dette må du vite om data science"
          />
          <GridCard 
            className="min-h-[280px]"
            image="/images/placeholders/article-placeholder.svg"
            tag="Gadgets"
            title="De beste dingsene for et smartere hjem"
          />
        </div>
          </>
        )}

      </main>
      
      <Footer />
    </div>
  );
}
