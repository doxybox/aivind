import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import { CalendarDays, Clock3, Copy, Link2, Lock, Mail, MessageCircle, Share2 } from "lucide-react";
import ArticleComments from "@/components/aivind/ArticleComments";
import AdSlot from "@/components/aivind/AdSlot";
import EditorialHeader from "@/components/aivind/EditorialHeader";
import Footer from "@/components/aivind/Footer";
import PremiumArticleBadge from "@/components/aivind/PremiumArticleBadge";
import SearchOverlay from "@/components/aivind/SearchOverlay";
import { getLegacyArticleBySlug, getLegacyArticles } from "@/lib/legacy-article-data";
import { isPayloadContentSource } from "@/lib/server/content-source";
import {
  getArticleBySlug,
  getArticlePreviewBySlug,
  getPublishedArticles,
  mapPayloadArticleToLegacyArticle,
  mapPayloadArticleToPageData,
} from "@/lib/server/payload-public-data";
import { getArticleAccessForUser } from "@/lib/server/article-access";
import { getCurrentUser } from "@/lib/server/auth-helpers";
import { verifyPayloadPreviewToken } from "@/lib/server/payload-preview";
import { useLivePreview } from "@payloadcms/live-preview-react";

function mapPayloadPreviewArticle(payloadArticle, initialArticle) {
  if (!payloadArticle) return initialArticle;

  const categories = Array.isArray(payloadArticle.categories)
    ? payloadArticle.categories.filter((category) => category && typeof category === "object")
    : [];
  const authors = Array.isArray(payloadArticle.authors)
    ? payloadArticle.authors.filter((author) => author && typeof author === "object")
    : [];
  const primaryCategory = categories[0] || null;
  const primaryAuthor = authors[0] || null;
  const heroMedia = payloadArticle.heroMedia && typeof payloadArticle.heroMedia === "object"
    ? payloadArticle.heroMedia
    : payloadArticle.seoImage && typeof payloadArticle.seoImage === "object"
      ? payloadArticle.seoImage
      : null;

  return {
    ...initialArticle,
    title: payloadArticle.title || initialArticle.title,
    slug: payloadArticle.slug || initialArticle.slug,
    excerpt: payloadArticle.excerpt || "",
    content: payloadArticle.content || "",
    body: payloadArticle.content || "",
    categories: categories.map((category) => ({ name: category.name, slug: category.slug })),
    category: primaryCategory?.name || initialArticle.category,
    categorySlug: primaryCategory?.slug || initialArticle.categorySlug,
    author: primaryAuthor?.name || initialArticle.author,
    authorName: primaryAuthor?.name || initialArticle.authorName,
    heroImage: heroMedia?.deliveryUrl || heroMedia?.thumbnailUrl || initialArticle.heroImage,
    heroImageAlt: heroMedia?.alt || heroMedia?.title || payloadArticle.title || initialArticle.heroImageAlt,
    seoTitle: payloadArticle.seoTitle || payloadArticle.title || initialArticle.seoTitle,
    seoDescription: payloadArticle.seoDescription || payloadArticle.excerpt || initialArticle.seoDescription,
    seoImage: payloadArticle.seoImage?.deliveryUrl || payloadArticle.seoImage?.thumbnailUrl || initialArticle.seoImage,
    canonicalUrl: payloadArticle.canonicalUrl || initialArticle.canonicalUrl,
    publishedAt: payloadArticle.publishedAt || initialArticle.publishedAt,
    updatedAt: payloadArticle.updatedAt || initialArticle.updatedAt,
    restricted: false,
    canReadFullBody: true,
  };
}

function EditorialPreviewSync({ initialData, serverURL, onUpdate }) {
  const { data } = useLivePreview({ initialData, serverURL, depth: 2 });

  useEffect(() => {
    if (data) onUpdate(data);
  }, [data, onUpdate]);

  return null;
}

function renderArticleBlocks(body = "", fallback = "") {
  const blocks = String(body || fallback || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return <h2 key={index} className="mt-10 text-2xl font-black leading-tight tracking-tight text-foreground md:text-3xl">{block.slice(3)}</h2>;
    }

    if (block.startsWith("> ")) {
      return (
        <blockquote key={index} className="my-8 border-l-2 border-[#ff6a00] bg-muted/25 px-5 py-4 text-lg italic leading-8 text-foreground/85">
          {block.slice(2)}
        </blockquote>
      );
    }

    return <p key={index} className="mt-5 text-[16px] leading-8 text-foreground/90 md:text-[17px]">{block}</p>;
  });
}

function formatPublishedDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ShareActions({ title, canonicalUrl }) {
  const [copied, setCopied] = useState(false);
  const url = canonicalUrl || (typeof window !== "undefined" ? window.location.href : "");

  const copyLink = async () => {
    if (!url || !navigator.clipboard) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share && url) {
      await navigator.share({ title, url });
      return;
    }
    await copyLink();
  };

  return (
    <div className="flex items-center gap-2" aria-label="Del artikkelen">
      <span className="hidden text-[11px] text-muted-foreground sm:inline">Del artikkelen</span>
      <button type="button" onClick={copyLink} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00]" aria-label="Kopier lenke" title={copied ? "Lenke kopiert" : "Kopier lenke"}>
        {copied ? <Copy className="h-4 w-4 text-[#ff6a00]" /> : <Link2 className="h-4 w-4" />}
      </button>
      <button type="button" onClick={share} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00]" aria-label="Del artikkelen" title="Del artikkelen">
        <Share2 className="h-4 w-4" />
      </button>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00]" aria-label="Del med e-post" title="Del med e-post">
        <Mail className="h-4 w-4" />
      </a>
    </div>
  );
}

function AdPlaceholder({ placement, size }) {
  return (
    <AdSlot placement={placement} className={size === "300 x 600" ? "min-h-[370px]" : "min-h-[170px]"} fallbackDescription={size} />
  );
}

function RelatedArticleCard({ article }) {
  const image = article.image || article.imageUrl || "/images/placeholders/article-placeholder.svg";
  const href = article.href || (article.slug ? `/artikler/${article.slug}` : "#");

  return (
    <Link href={href} className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-[#ff6a00]/50">
      <div className="relative aspect-[16/9] bg-muted">
        <Image src={image} alt={article.imageAlt || article.title} fill sizes="(max-width: 768px) 100vw, 33vw" unoptimized className="object-cover transition-transform duration-300 group-hover:scale-105" />
        <PremiumArticleBadge article={article} compact corner />
      </div>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff6a00]">{article.category || "Nyheter"}</p>
        <h3 className="mt-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-[#ff6a00]">{article.title}</h3>
        {article.time && <p className="mt-3 text-xs text-muted-foreground">{article.time}</p>}
      </div>
    </Link>
  );
}

export default function ArticlePage({ article: initialArticle, searchArticles = [], canonicalUrl = "", isEditorialPreview = false, livePreviewInitialData = null, payloadServerUrl = "" }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [livePayloadArticle, setLivePayloadArticle] = useState(livePreviewInitialData);
  const article = useMemo(
    () => isEditorialPreview ? mapPayloadPreviewArticle(livePayloadArticle, initialArticle) : initialArticle,
    [initialArticle, isEditorialPreview, livePayloadArticle],
  );
  const paragraphs = useMemo(() => renderArticleBlocks(article.content || article.body || "", article.excerpt || ""), [article]);
  const publishedLabel = formatPublishedDate(article.publishedAt);
  const showPaywall = article.restricted && !article.canReadFullBody;
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || "";
  const canonical = article.canonicalUrl || canonicalUrl || "";
  const access = article.viewerAccess || {};
  const loginRequired = access.requiredAction === "login";
  const categories = article.categories?.length ? article.categories : article.category ? [{ name: article.category, slug: article.categorySlug }] : [];
  const authorName = article.authorName || article.author || "TEKKNO";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const relatedArticles = useMemo(() => {
    const others = searchArticles.filter((candidate) => candidate?.slug && candidate.slug !== article.slug);
    const categoryMatches = others.filter((candidate) => candidate.categorySlug && candidate.categorySlug === article.categorySlug);
    return [...categoryMatches, ...others.filter((candidate) => !categoryMatches.includes(candidate))].slice(0, 3);
  }, [article.categorySlug, article.slug, searchArticles]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-[#ff6a00] selection:text-white transition-colors duration-300 dark:bg-[#161a22] dark:text-white">
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
      <EditorialHeader onSearchClick={() => setIsSearchOpen(true)} />

      {isEditorialPreview && livePreviewInitialData && payloadServerUrl && (
        <EditorialPreviewSync initialData={livePreviewInitialData} serverURL={payloadServerUrl} onUpdate={setLivePayloadArticle} />
      )}

      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        {isEditorialPreview && (
          <div className="mb-6 rounded-lg border border-[#ff6a00]/45 bg-[#ff6a00]/10 px-4 py-3 text-sm font-semibold text-foreground">
            Redaksjonell forhåndsvisning. Dette utkastet er ikke synlig for lesere.
          </div>
        )}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <header className="max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                {categories.map((category) => (
                  <Link key={category.slug || category.name} href={category.slug ? `/${category.slug}` : "#"} className="text-sm font-black uppercase tracking-[0.16em] text-[#ff6a00] transition-opacity hover:opacity-75">
                    {category.name}
                  </Link>
                ))}
                <PremiumArticleBadge article={article} compact />
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">{article.title}</h1>

              {article.excerpt && <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">{article.excerpt}</p>}

              {article.heroImage && (
                <figure className="mt-7 overflow-hidden rounded-xl border border-border bg-muted">
                  <Image src={article.heroImage} alt={article.heroImageAlt || article.title} width={1600} height={900} unoptimized priority className="aspect-[16/9] w-full object-cover" />
                </figure>
              )}

              <div className="mt-7 flex flex-col justify-between gap-5 border-y border-border py-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-black text-foreground">{authorInitial}</span>
                  <span className="font-bold text-foreground">{authorName}</span>
                  {publishedLabel && <><span className="hidden h-1 w-1 rounded-full bg-[#ff6a00] sm:inline" /><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{publishedLabel}</span></>}
                  {article.readTime && <><span className="hidden h-1 w-1 rounded-full bg-[#ff6a00] sm:inline" /><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{article.readTime} lesetid</span></>}
                  <span className="hidden h-1 w-1 rounded-full bg-[#ff6a00] sm:inline" />
                  <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />{commentCount} kommentarer</span>
                </div>
                <ShareActions title={article.title} canonicalUrl={canonical} />
              </div>
            </header>

            <div className="mt-8 max-w-3xl">
              {paragraphs.length > 0 ? paragraphs : <p className="text-[16px] leading-8 text-foreground/90 md:text-[17px]">{article.excerpt}</p>}
            </div>

            {showPaywall && (
              <section className="mt-9 max-w-3xl rounded-xl border border-[#ff6a00]/35 bg-[#ff6a00]/10 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff6a00]/15 text-[#ff6a00]"><Lock className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">Denne artikkelen krever tilgang</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{loginRequired ? "Logg inn for å sjekke om brukeren din har tilgang, eller velg et abonnement." : "Full artikkeltekst vises bare når aktivt abonnement eller riktig tilgang er bekreftet server-side."}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {loginRequired && <Link href={`/login?next=${encodeURIComponent(`/artikler/${article.slug}`)}`} className="rounded-lg border border-[#ff6a00]/40 px-4 py-2.5 text-sm font-bold text-[#ff6a00] transition-colors hover:bg-[#ff6a00]/10">Logg inn</Link>}
                      <Link href="/min-side?upgrade=true" className="rounded-lg bg-[#ff6a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#ea5f00]">Se abonnement</Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!showPaywall && <ArticleComments articleSlug={article.slug} onCountChange={setCommentCount} />}

            {categories.length > 0 && (
              <section className="mt-10 max-w-3xl border-t border-border pt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Emner</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => <Link key={category.slug || category.name} href={category.slug ? `/${category.slug}` : "#"} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00]">{category.name}</Link>)}
                </div>
              </section>
            )}

            {relatedArticles.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Les også</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{relatedArticles.map((relatedArticle) => <RelatedArticleCard key={relatedArticle.slug} article={relatedArticle} />)}</div>
              </section>
            )}
          </article>

          <aside className="space-y-8 lg:sticky lg:top-24">
            <AdPlaceholder placement="article-sidebar-top" size="300 x 600" />
            <AdPlaceholder placement="article-sidebar-bottom" size="300 x 250" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function getServerSideProps({ params, req }) {
  const slug = params?.slug || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const localPreviewArticle = getLegacyArticleBySlug(slug);
  const isEditorialPreview = verifyPayloadPreviewToken(slug, req.cookies?.payload_editorial_preview);

  if (isEditorialPreview) {
    const payloadArticle = await getArticlePreviewBySlug(slug);
    if (!payloadArticle) return { notFound: true };

    const article = mapPayloadArticleToPageData(payloadArticle, { canReadFullBody: true });
    const searchArticles = (await getPublishedArticles({ limit: 50 })).map(mapPayloadArticleToLegacyArticle);

    return {
      props: {
        article,
        searchArticles,
        canonicalUrl: "",
        isEditorialPreview: true,
        livePreviewInitialData: payloadArticle,
        payloadServerUrl: process.env.PAYLOAD_PUBLIC_SERVER_URL || "",
      },
    };
  }

  if (localPreviewArticle?.isTemplatePreview) {
    return {
      props: {
        article: {
          ...localPreviewArticle,
          body: localPreviewArticle.content || localPreviewArticle.excerpt || "",
          content: localPreviewArticle.content || localPreviewArticle.excerpt || "",
          restricted: false,
          canReadFullBody: true,
          heroImage: localPreviewArticle.image,
          heroImageAlt: localPreviewArticle.title,
          seoTitle: localPreviewArticle.title,
          seoDescription: localPreviewArticle.excerpt || "",
          seoImage: localPreviewArticle.image,
        },
        searchArticles: getLegacyArticles(),
        canonicalUrl: "",
      },
    };
  }

  if (isPayloadContentSource()) {
    const payloadArticle = await getArticleBySlug(slug);

    if (!payloadArticle) {
      if (!localPreviewArticle) return { notFound: true };

      return {
        props: {
          article: {
            ...localPreviewArticle,
            body: localPreviewArticle.content || localPreviewArticle.excerpt || "",
            content: localPreviewArticle.content || localPreviewArticle.excerpt || "",
            restricted: false,
            canReadFullBody: true,
            heroImage: localPreviewArticle.image,
            heroImageAlt: localPreviewArticle.title,
            seoTitle: localPreviewArticle.title,
            seoDescription: localPreviewArticle.excerpt || "",
            seoImage: localPreviewArticle.image,
            publishedAt: localPreviewArticle.publishedAt || "",
          },
          searchArticles: getLegacyArticles(),
          canonicalUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/artikler/${localPreviewArticle.slug}` : "",
        },
      };
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

  const legacyArticle = localPreviewArticle;
  if (!legacyArticle) return { notFound: true };

  return {
    props: {
      article: {
        ...legacyArticle,
        body: legacyArticle.content || legacyArticle.excerpt || "",
        content: legacyArticle.content || legacyArticle.excerpt || "",
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
