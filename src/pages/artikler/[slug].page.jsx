import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Lock, Menu, Moon, Search, X } from "lucide-react";
import { GiFlashGrenade } from "react-icons/gi";
import { useTheme } from "@/hooks/useTheme";
import Footer from "@/components/aivind/Footer";
import ArticleReactions from "@/components/aivind/ArticleReactions";
import SearchOverlay from "@/components/aivind/SearchOverlay";
import { categoryNavItems } from "@/components/aivind/categoryNav";
import { getLegacyArticleBySlug, getLegacyArticles } from "@/lib/legacy-article-data";
import { isPayloadContentSource } from "@/lib/server/content-source";
import {
  getArticleBySlug,
  getPublishedArticles,
  mapPayloadArticleToLegacyArticle,
  mapPayloadArticleToPageData,
} from "@/lib/server/payload-public-data";
import { getArticleAccessForUser } from "@/lib/server/article-access";
import { getCurrentUser } from "@/lib/server/auth-helpers";

function ArticleHeader({ onSearchClick }) {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 bottom-0 w-64 bg-white dark:bg-[#161a22] border-l border-zinc-200 dark:border-white/10 p-6 flex flex-col transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
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
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors">
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
              <Link key={item.href} href={item.href} className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
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

function renderParagraphs(body = "") {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function ArticlePage({ article, searchArticles = [], canonicalUrl = "" }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const paragraphs = useMemo(() => renderParagraphs(article.content || article.body || ""), [article]);
  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const showPaywall = article.restricted && !article.canReadFullBody;
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || "";
  const canonical = article.canonicalUrl || canonicalUrl || "";
  const access = article.viewerAccess || {};
  const loginRequired = access.requiredAction === "login";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#161a22] text-zinc-900 dark:text-white font-sans selection:bg-[#ff6a00] selection:text-white transition-colors duration-300">
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:type" content="article" />
        {article.seoImage && <meta property="og:image" content={article.seoImage} />}
        {canonical && <link rel="canonical" href={canonical} />}
        {article.publishedAt && <meta property="article:published_time" content={article.publishedAt} />}
        {article.updatedAt && <meta property="article:modified_time" content={article.updatedAt} />}
      </Head>

      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} articles={searchArticles} />
      <ArticleHeader onSearchClick={() => setIsSearchOpen(true)} />

      <main className="max-w-[980px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <button onClick={() => router.back()} className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#ff6a00] mb-6">
          Tilbake
        </button>

        <article>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {article.category && (
              <Link href={article.categorySlug ? `/${article.categorySlug}` : "#"} className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff6a00]">
                {article.category}
              </Link>
            )}
            {article.accessLevel && article.accessLevel !== "public" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Lock className="w-3.5 h-3.5" />
                {article.accessLevel}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.02] mb-5">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[13px] text-zinc-500 dark:text-zinc-400 mb-8">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{article.authorName || article.author || "TEKKNO"}</span>
            {publishedLabel && <><span className="w-1 h-1 rounded-full bg-[#ff6a00]" /><span>{publishedLabel}</span></>}
            {article.readTime && <><span className="w-1 h-1 rounded-full bg-[#ff6a00]" /><span>{article.readTime}</span></>}
          </div>

          <ArticleReactions article={article} className="-mt-5 mb-8" />

          {article.heroImage && (
            <figure className="mb-8 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#1e232e]">
              <img src={article.heroImage} alt={article.heroImageAlt || article.title} className="w-full aspect-[16/9] object-cover" />
            </figure>
          )}

          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:text-[18px] prose-p:leading-8">
            {paragraphs.length > 0 ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{article.excerpt}</p>}
          </div>

          {showPaywall && (
            <div className="mt-8 rounded-xl border border-[#ff6a00]/30 bg-[#ff6a00]/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ff6a00]/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#ff6a00]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Denne artikkelen krever tilgang</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                    {loginRequired
                      ? "Logg inn for a sjekke om brukeren din har tilgang, eller velg et abonnement."
                      : "Full artikkeltekst vises bare nar aktivt abonnement eller riktig entitlement er bekreftet server-side."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {loginRequired && (
                      <Link href={`/login?next=${encodeURIComponent(`/artikler/${article.slug}`)}`} className="inline-flex px-4 py-2 rounded-lg border border-[#ff6a00]/40 text-[#ff6a00] text-sm font-bold hover:bg-[#ff6a00]/10 transition-colors">
                        Logg inn
                      </Link>
                    )}
                    <Link href="/min-side?upgrade=true" className="inline-flex px-4 py-2 rounded-lg bg-[#ff6a00] text-white text-sm font-bold hover:bg-[#ff7f24] transition-colors">
                      Se abonnement
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

export async function getServerSideProps({ params, req }) {
  const slug = params?.slug || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (isPayloadContentSource()) {
    const payloadArticle = await getArticleBySlug(slug);

    if (!payloadArticle) {
      return { notFound: true };
    }

    const user = await getCurrentUser(req);
    const viewerAccess = await getArticleAccessForUser(user, payloadArticle);
    const article = {
      ...mapPayloadArticleToPageData(payloadArticle, { canReadFullBody: viewerAccess.canReadFullBody }),
      viewerAccess,
    };
    const searchArticles = (await getPublishedArticles({ limit: 50 })).map(mapPayloadArticleToLegacyArticle);

    return {
      props: {
        article,
        searchArticles,
        canonicalUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/artikler/${article.slug}` : "",
      },
    };
  }

  const legacyArticle = getLegacyArticleBySlug(slug);

  if (!legacyArticle) {
    return { notFound: true };
  }

  return {
    props: {
      article: {
        ...legacyArticle,
        body: legacyArticle.excerpt || "",
        content: legacyArticle.excerpt || "",
        restricted: false,
        canReadFullBody: true,
        heroImage: legacyArticle.image,
        heroImageAlt: legacyArticle.title,
        seoTitle: legacyArticle.title,
        seoDescription: legacyArticle.excerpt || "",
        seoImage: legacyArticle.image,
        publishedAt: legacyArticle.publishedAt || "",
      },
      searchArticles: getLegacyArticles(),
      canonicalUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/artikler/${legacyArticle.slug}` : "",
    },
  };
}
