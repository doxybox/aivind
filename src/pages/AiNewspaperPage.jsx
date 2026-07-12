import React from "react";
import Link from "next/link";
import { Menu, Moon, Search, X } from "lucide-react";
import { GiFlashGrenade } from "react-icons/gi";
import { useTheme } from "@/hooks/useTheme";
import SearchOverlay from "@/components/aivind/SearchOverlay";
import Footer from "@/components/aivind/Footer";
import { categoryNavItems } from "@/components/aivind/categoryNav";
import ReelsSection from "@/components/aivind/ReelsSection";
import ArticleReactions from "@/components/aivind/ArticleReactions";
import { allArticles } from "@/lib/articles";

const defaultCategoryConfig = {
  slug: "ai",
  title: "AI",
  kicker: "Kunstig intelligens",
  intro: "Nyheter, guider og tester om verktøyene som endrer jobb, kreativitet og teknologi.",
  heroImage: "/images/placeholders/article-placeholder.svg",
  latestTitle: "Siste innen AI",
  latestLinkText: "Se alle AI-saker",
  secondaryTitle: "Guider og forklaringer",
  secondaryLinkText: "Se alle guider",
  moreTitle: "Flere AI-artikler",
  moreLinkText: "Mer AI",
};

const stories = [
  {
    title: "OpenAI lanserer GPT-4o - enda smartere og raskere enn før",
    excerpt: "Ny modell gir bedre resonnering, multimodal forståelse og lavere responstid. Her er alt du trenger å vite.",
    tag: "AI",
    time: "2 timer siden",
    read: "6 min",
    comments: "42 kommentarer",
    reactions: 42,
    image: "/images/placeholders/article-placeholder.svg",
    featured: true,
  },
  {
    title: "Slik lager du fotorealistiske AI-bilder med Midjourney v6",
    excerpt: "En praktisk gjennomgang av prompts, lyssetting og de små grepene som gir bildene et mer ekte uttrykk.",
    tag: "AI",
    time: "5 dager siden",
    read: "15 min",
    comments: "45 kommentarer",
    reactions: 45,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Test: De beste AI-assistentene på mobilen akkurat nå",
    excerpt: "Vi har testet appene som lover raskere svar, bedre tale og smartere hjelp i lomma.",
    tag: "AI",
    time: "1 uke siden",
    read: "8 min",
    comments: "24 kommentarer",
    reactions: 24,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "OpenAI slipper ny API-plattform spesialisert for norsk språk",
    excerpt: "Norske bedrifter får enklere integrasjon, bedre språkforståelse og lavere terskel for å bygge AI-verktøy.",
    tag: "AI",
    time: "19 timer siden",
    read: "3 min",
    comments: "12 kommentarer",
    reactions: 12,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Ny norsk språkmodell knuser GPT-4 på nynorsk",
    excerpt: "Forskere mener modellen treffer bedre på dialekt, kontekst og norske uttrykk enn de største globale modellene.",
    tag: "AI",
    time: "1 måned siden",
    read: "4 min",
    comments: "113 kommentarer",
    reactions: 113,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Slik påvirker AI-verktøy arbeidsplassen i 2026",
    excerpt: "Automatisering flytter seg fra eksperiment til daglig arbeidsflyt. Dette er jobbene som merker det først.",
    tag: "AI",
    time: "2 dager siden",
    read: "12 min",
    comments: "33 kommentarer",
    reactions: 33,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Slik avslører du AI-genererte bilder på 5 sekunder",
    excerpt: "Se etter hud, tekst, refleksjoner og små logiske brudd. Disse tegnene går igjen oftere enn du tror.",
    tag: "AI",
    time: "2 dager siden",
    read: "5 min",
    comments: "34 kommentarer",
    reactions: 34,
    image: "/images/placeholders/article-placeholder.svg",
  },
];

const aiReels = [
  {
    id: "ai-reel-1",
    title: "ChatGPT-appen får stemme og bilder",
    views: "1,7k",
    duration: "0:28",
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    id: "ai-reel-2",
    title: "Slik avslører du AI-genererte bilder",
    views: "2,1k",
    duration: "0:31",
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    id: "ai-reel-3",
    title: "Midjourney v6: tre grep som gir bedre bilder",
    views: "987",
    duration: "0:25",
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    id: "ai-reel-4",
    title: "AI på jobb: dette kan du automatisere først",
    views: "1,5k",
    duration: "0:34",
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    id: "ai-reel-5",
    title: "Ny norsk språkmodell forklart på ett minutt",
    views: "1,2k",
    duration: "0:29",
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    id: "ai-reel-6",
    title: "Fem AI-verktøy som faktisk sparer tid",
    views: "3,4k",
    duration: "0:45",
    image: "/images/placeholders/article-placeholder.svg",
  },
];

const guides = [
  {
    title: "Kom i gang med ChatGPT - 12 konkrete tips",
    excerpt: "Slik får du bedre svar, raskere struktur og mindre rot når du bruker ChatGPT i hverdagen.",
    tag: "AI",
    time: "1 uke siden",
    read: "9 min",
    comments: "27 kommentarer",
    reactions: 27,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Prompt engineering: Slik får du bedre svar fra AI-en",
    excerpt: "Små endringer i instruksjonen kan gi langt bedre resultater. Her er malene som fungerer.",
    tag: "AI",
    time: "2 dager siden",
    read: "6 min",
    comments: "18 kommentarer",
    reactions: 18,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Automatiser hverdagen med AI og NoCode-verktøy",
    excerpt: "Koble sammen e-post, dokumenter og oppgaver uten å skrive kode.",
    tag: "AI",
    time: "1 uke siden",
    read: "11 min",
    comments: "14 kommentarer",
    reactions: 14,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "EU AI Act forklart - dette betyr det for deg",
    excerpt: "Reglene kommer raskt. Dette bør brukere, gründere og utviklere vite nå.",
    tag: "AI",
    time: "5 dager siden",
    read: "6 min",
    comments: "18 kommentarer",
    reactions: 18,
    image: "/images/placeholders/article-placeholder.svg",
  },
];

const latestAiStories = [
  {
    title: "7 AI-verktøy som faktisk sparer deg tid på kontoret",
    excerpt: "Vi skiller nyttige arbeidsflyter fra hype og finner verktøyene som gir mest igjen i hverdagen.",
    tag: "AI",
    reactions: 88,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Slik bruker du ChatGPT til å planlegge en hel arbeidsuke",
    excerpt: "Fra prioritering og e-post til notater og møter: dette er promptene som faktisk fungerer.",
    tag: "AI",
    reactions: 36,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Nå kommer AI-agentene som kan gjøre oppgaver for deg",
    excerpt: "Neste bølge handler ikke bare om svar, men om systemer som kan hente, vurdere og utføre.",
    tag: "AI",
    reactions: 64,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Hva betyr EU AI Act for norske småbedrifter?",
    excerpt: "Reglene treffer bredere enn mange tror. Her er punktene du bør ha kontroll på først.",
    tag: "AI",
    reactions: 22,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Apple gjør Siri smartere: Dette kan endre mobilen din",
    excerpt: "Mer personlig kontekst, bedre språk og tettere kobling til appene du bruker mest.",
    tag: "AI",
    reactions: 57,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "AI i nettleseren: Slik blir research raskere",
    excerpt: "Sammendrag, kildekontroll og smarte spørsmål gjør nettleseren til et sterkere arbeidsverktøy.",
    tag: "AI",
    reactions: 31,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Derfor satser Nvidia alt på AI-PC-er",
    excerpt: "Lokale språkmodeller og kraftigere brikker kan flytte mye av AI-jobben bort fra skyen.",
    tag: "AI",
    reactions: 49,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Slik lager du bedre AI-video uten at det ser kunstig ut",
    excerpt: "Små grep i prompt, bevegelse og klipp gjør videoene mer troverdige.",
    tag: "AI",
    reactions: 27,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "De vanligste AI-feilene norske bedrifter gjør",
    excerpt: "For lite datagrunnlag, uklare mål og for mange pilotprosjekter gjør satsingen tregere.",
    tag: "AI",
    reactions: 19,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "Kan AI skrive bedre kode enn juniorutviklere?",
    excerpt: "Vi ser på hva modellene mestrer, hvor de bommer og hvordan team bør bruke dem.",
    tag: "AI",
    reactions: 73,
    image: "/images/placeholders/article-placeholder.svg",
  },
  {
    title: "ChatGPT vs Gemini vs Claude: Hvilken passer best for deg?",
    excerpt: "Tre assistenter, tre styrker. Her er forskjellene som betyr noe i praksis.",
    tag: "AI",
    reactions: 91,
    image: "/images/placeholders/article-placeholder.svg",
  },
];

function Badge({ children }) {
  return (
    <span className="inline-flex w-fit rounded bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6a00]">
      {children}
    </span>
  );
}

function normalizeAiStory(story = {}, fallbackTag = "AI") {
  return {
    ...story,
    tag: story.tag || story.category || fallbackTag,
    reactions: story.reactions ?? story.comments ?? 0,
    image: story.image || story.imageUrl || "/images/placeholders/article-placeholder.svg",
  };
}

function PayloadEmptyState({ categoryTitle }) {
  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-white/70 p-8 text-center shadow-sm dark:bg-[#101720]">
      <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#ff6a00]">Payload</p>
      <h2 className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">Ingen publiserte {categoryTitle}-saker ennå</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        Når publiserte Payload-artikler legges i {categoryTitle}-kategorien, vises de her. Drafts, fremtidige saker og upublisert innhold skjules.
      </p>
    </section>
  );
}

function ArticleCard({ story, large = false, className = "" }) {
  const content = (
    <>
      <img src={story.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-[#161a22]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-transparent to-transparent opacity-80" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 flex flex-col items-start">
        <Badge>{story.tag}</Badge>
        <h2 className={`mt-4 font-bold text-white leading-[1.2] ${large ? "text-3xl md:text-5xl lg:text-[56px] font-black tracking-tight" : "text-xl md:text-2xl line-clamp-2"}`}>
          {story.title}
        </h2>
        {story.excerpt && <p className="text-white/90 text-sm mt-3 line-clamp-2 leading-relaxed">{story.excerpt}</p>}
        <ArticleReactions article={story} count={story.reactions} className="mt-3" />
      </div>
    </>
  );

  if (story.href) {
    return (
      <Link href={story.href} className={`group relative block overflow-hidden rounded-xl border border-white bg-[#101720] shadow-sm transition-colors duration-300 dark:border-white/10 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={`group relative overflow-hidden rounded-xl border border-white bg-[#101720] shadow-sm transition-colors duration-300 dark:border-white/10 ${className}`}>
      {content}
    </article>
  );
}

function SmallArticle({ story }) {
  const content = (
    <>
      <img src={story.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111722] from-0% via-[#111722]/68 via-48% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 flex max-h-[78%] flex-col items-start">
        <Badge>{story.tag}</Badge>
        <h3 className="mt-3 text-[17px] md:text-[18px] font-bold text-white leading-[1.18] line-clamp-2">{story.title}</h3>
        {story.excerpt && <p className="text-white/85 text-[12.5px] mt-2.5 line-clamp-2 leading-[1.55]">{story.excerpt}</p>}
        <ArticleReactions article={story} count={story.reactions} className="mt-3" />
      </div>
    </>
  );

  if (story.href) {
    return (
      <Link href={story.href} className="group relative block min-h-[300px] overflow-hidden rounded-xl border border-white bg-[#101720] shadow-sm transition-colors duration-300 dark:border-white/10">
        {content}
      </Link>
    );
  }

  return (
    <article className="group relative min-h-[300px] overflow-hidden rounded-xl border border-white bg-[#101720] shadow-sm transition-colors duration-300 dark:border-white/10">
      {content}
    </article>
  );
}

function SectionHeading({ title, hrefText, href }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-[13px] font-black uppercase tracking-[0.24em] text-[#ff6a00]">{title}</h2>
      <Link href={href} className="text-[12px] font-bold text-[#ff6a00] hover:text-[#ff8c33]">
        {hrefText} →
      </Link>
    </div>
  );
}

function AiHeader({ activeSlug, onSearchClick }) {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 bottom-0 w-64 bg-white dark:bg-[#161a22] border-l border-zinc-200 dark:border-white/10 p-6 flex flex-col transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <span className="text-zinc-900 dark:text-white font-black text-xl tracking-tighter uppercase">MENY</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {categoryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  item.href === `/${activeSlug}` ? "text-[#ff6a00]" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-zinc-200 dark:bg-white/10 w-full my-2" />
            <Link href="/login" className="text-sm font-bold uppercase tracking-wider text-[#ff6a00] hover:text-[#ff8c33] transition-colors">
              LOGG INN
            </Link>
          </nav>
        </div>
      </div>

      <header className="h-[72px] flex items-center justify-between px-6 bg-white dark:bg-[#161a22] border-b border-zinc-200 dark:border-white/5 sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-zinc-900 dark:text-white font-black text-2xl tracking-tighter uppercase">
              TEKKNO<span className="text-[#ff6a00]">.NO</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {categoryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  item.href === `/${activeSlug}` ? "text-[#ff6a00]" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors hidden sm:block">
            LOGG INN
          </Link>
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <button onClick={toggleTheme} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              {theme === "dark" ? <GiFlashGrenade className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={onSearchClick} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default function AiNewspaperPage({
  payloadCategoryPage = null,
  payloadMode = false,
  categoryConfig = defaultCategoryConfig,
  legacyStories = stories,
  legacyLatestStories = latestAiStories,
  legacySecondaryStories = guides,
  reels = aiReels,
}) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const category = { ...defaultCategoryConfig, ...categoryConfig };
  const categoryTitle = payloadCategoryPage?.category?.title || payloadCategoryPage?.category?.name || category.title;
  const categoryPath = `/${category.slug}`;
  const payloadStories = (payloadCategoryPage?.articles || []).map((story) => normalizeAiStory(story, categoryTitle));
  const payloadHasStories = payloadStories.length > 0;
  const mainStories = payloadMode ? payloadStories : legacyStories.map((story) => normalizeAiStory(story, categoryTitle));
  const guideStories = payloadMode
    ? payloadStories.slice(7, 11)
    : legacySecondaryStories.map((story) => normalizeAiStory(story, categoryTitle));
  const latestStories = payloadMode
    ? payloadStories.slice(3)
    : legacyLatestStories.map((story) => normalizeAiStory(story, categoryTitle));
  const searchArticles = payloadMode ? (payloadCategoryPage?.searchArticles || payloadStories) : allArticles;
  const heroImage = category.heroImage || mainStories[0]?.image || defaultCategoryConfig.heroImage;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#161a22] text-zinc-900 dark:text-white font-sans selection:bg-[#ff6a00] selection:text-white transition-colors duration-300">
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} articles={searchArticles} />
      <AiHeader activeSlug={category.slug} onSearchClick={() => setIsSearchOpen(true)} />

      <main className="max-w-[1440px] mx-auto p-4 md:p-6 pb-20">
        <section className="relative mb-4 overflow-hidden rounded-xl border border-white/15 bg-[#0b141d] text-white transition-colors duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_50%,rgba(255,106,0,0.33),transparent_32%),linear-gradient(90deg,rgba(7,16,25,0.98),rgba(7,16,25,0.76),rgba(7,16,25,0.2))]" />
          <img
            src={heroImage}
            alt=""
            className="absolute right-0 top-0 h-full w-full object-cover opacity-55"
          />
          <div className="relative z-10 min-h-[220px] px-6 py-8 md:px-8 md:py-10">
            <p className="text-[12px] font-black uppercase tracking-[0.42em] text-[#ff6a00]">{category.kicker}</p>
            <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">{categoryTitle}</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-200">
              {payloadCategoryPage?.category?.intro || category.intro}
            </p>
          </div>
        </section>

        {payloadMode && !payloadHasStories ? (
          <PayloadEmptyState categoryTitle={categoryTitle} />
        ) : (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {mainStories[0] && <ArticleCard story={mainStories[0]} large className="lg:col-span-2 min-h-[400px] lg:min-h-[500px]" />}
              <div className="flex flex-col gap-4">
                {mainStories.slice(1, 3).map((story) => (
                  <ArticleCard key={story.id || story.slug || story.title} story={story} className="flex-1 min-h-[240px]" />
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {mainStories.slice(3, 7).map((story) => (
                <SmallArticle key={story.id || story.slug || story.title} story={story} />
              ))}
            </section>
          </>
        )}

        {reels.length > 0 && <ReelsSection items={reels} />}

        {latestStories.length > 0 && (
          <section className="mb-6">
            <SectionHeading
              title={categoryConfig.latestTitle || `Siste innen ${categoryTitle}`}
              hrefText={categoryConfig.latestLinkText || `Se alle ${categoryTitle}-saker`}
              href={categoryPath}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestStories.slice(0, 4).map((story) => (
                <SmallArticle key={story.id || story.slug || story.title} story={story} />
              ))}
            </div>
          </section>
        )}

        {guideStories.length > 0 && (
          <section className="mb-6">
            <SectionHeading
              title={categoryConfig.secondaryTitle || `Mer fra ${categoryTitle}`}
              hrefText={categoryConfig.secondaryLinkText || `Se mer ${categoryTitle}`}
              href={categoryPath}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guideStories.map((story) => (
                <SmallArticle key={story.id || story.slug || story.title} story={story} />
              ))}
            </div>
          </section>
        )}

        {latestStories.length > 4 && (
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <ArticleCard story={latestStories[4]} large className="lg:col-span-2 min-h-[360px] lg:min-h-[420px]" />
            <div className="flex flex-col gap-4">
              {latestStories.slice(5, 7).map((story) => (
                <ArticleCard key={story.id || story.slug || story.title} story={story} className="flex-1 min-h-[200px]" />
              ))}
            </div>
            {latestStories[7] && <ArticleCard story={latestStories[7]} className="min-h-[360px] lg:min-h-[420px]" />}
          </section>
        )}

        <div className="w-full mx-auto h-[250px] bg-[#161a22] border border-[#ff6a00]/40 shadow-[0_0_15px_rgba(255,106,0,0.1)] rounded-xl mt-8 mb-16 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)", backgroundSize: "16px 16px", WebkitMaskImage: "linear-gradient(to right, black, transparent)", maskImage: "linear-gradient(to right, black, transparent)" }} />
          <div className="absolute top-0 right-0 w-48 h-full opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)", backgroundSize: "16px 16px", WebkitMaskImage: "linear-gradient(to left, black, transparent)", maskImage: "linear-gradient(to left, black, transparent)" }} />

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

        {latestStories.length > 8 && (
          <section className="mb-6">
            <SectionHeading
              title={categoryConfig.moreTitle || `Flere ${categoryTitle}-artikler`}
              hrefText={categoryConfig.moreLinkText || `Mer ${categoryTitle}`}
              href={categoryPath}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestStories.slice(8).map((story) => (
                <SmallArticle key={story.id || story.slug || story.title} story={story} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
