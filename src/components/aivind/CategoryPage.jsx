import React from "react";
import AiNewspaperPage from "@/pages/AiNewspaperPage";
import { withArticleHref } from "@/lib/article-slugs";
import {
  aiArticlesData,
  evArticlesData,
  featuredArticles,
  gamingArticlesData,
  guideArticlesData,
  latestArticles,
  testArticlesData,
} from "@/lib/articles";

const extraArticles = {
  gadgets: [
    {
      id: 301,
      title: "De smarteste dingsene som faktisk fortjener plass hjemme",
      excerpt: "Vi har samlet produktene som løser hverdagsproblemene uten å bli enda en app du glemmer.",
      category: "Gadgets",
      time: "1 time siden",
      readTime: "5 min",
      comments: 44,
      type: "standard",
      image: "/images/placeholders/article-placeholder.svg",
    },
    {
      id: 302,
      title: "Ny ring måler puls, søvn og stress bedre enn klokka",
      excerpt: "Diskret helse-gadget med overraskende presise sensorer.",
      category: "Gadgets",
      time: "7 timer siden",
      readTime: "4 min",
      comments: 19,
      type: "standard",
      image: "/images/placeholders/article-placeholder.svg",
    },
    {
      id: 303,
      title: "Test: Smarte briller med skjerm foran øynene",
      excerpt: "Morsomt, futuristisk og fortsatt litt for spesielt for folk flest.",
      category: "Gadgets",
      time: "2 dager siden",
      readTime: "8 min",
      comments: 72,
      type: "test",
      score: "7.5/10",
      image: "/images/placeholders/article-placeholder.svg",
    },
  ],
  video: [
    {
      id: 401,
      title: "Se vår første tur med Volkswagens rimelige elbil",
      excerpt: "Kort test, ladestopp og de viktigste inntrykkene fra førermiljøet.",
      category: "Video",
      time: "3 timer siden",
      readTime: "6 min",
      comments: 91,
      type: "video",
      duration: "06:18",
      image: "/images/placeholders/article-placeholder.svg",
    },
    {
      id: 402,
      title: "Video: Slik bygger du en ryddig gaming-setup",
      excerpt: "Kabelføring, lys, skjermvalg og de små grepene som gir stor effekt.",
      category: "Video",
      time: "1 dag siden",
      readTime: "4 min",
      comments: 36,
      type: "video",
      duration: "08:42",
      image: "/images/placeholders/article-placeholder.svg",
    },
  ],
};

const categoryPages = {
  gaming: {
    slug: "gaming",
    title: "Gaming",
    kicker: "Spill og maskinvare",
    intro: "De største spillnyhetene, lekkasjene, testene og maskinvarevalgene for deg som spiller.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Siste innen gaming",
    latestLinkText: "Se alle gaming-saker",
    secondaryTitle: "Spill, utstyr og guider",
    secondaryLinkText: "Se mer gaming",
    moreTitle: "Flere gaming-artikler",
    moreLinkText: "Mer gaming",
    articles: gamingArticlesData,
  },
  elbil: {
    slug: "elbil",
    title: "Elbil",
    kicker: "Rekkevidde, lading og tester",
    intro: "Alt om nye modeller, ladefart, rekkevidde og bilene som faktisk er verdt pengene.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Siste innen elbil",
    latestLinkText: "Se alle elbil-saker",
    secondaryTitle: "Guider og kjopshjelp",
    secondaryLinkText: "Se flere elbilguider",
    moreTitle: "Flere elbil-artikler",
    moreLinkText: "Mer elbil",
    articles: evArticlesData,
  },
  gadgets: {
    slug: "gadgets",
    title: "Gadgets",
    kicker: "Dingser og smarthjem",
    intro: "Smarte produkter, mobiler, hodetelefoner og små teknologier som kan gjøre hverdagen bedre.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Siste innen gadgets",
    latestLinkText: "Se alle gadget-saker",
    secondaryTitle: "Guider og anbefalinger",
    secondaryLinkText: "Se flere gadgetguider",
    moreTitle: "Flere gadget-artikler",
    moreLinkText: "Mer gadgets",
    articles: [
      latestArticles.find((article) => article.id === 12),
      featuredArticles.find((article) => article.id === 4),
      ...extraArticles.gadgets,
    ],
  },
  tester: {
    slug: "tester",
    title: "Tester",
    kicker: "Vi har prøvd",
    intro: "Grundige tester av mobil, elbil, gaming, lyd og ny teknologi før du bruker pengene.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Nye tester",
    latestLinkText: "Se alle tester",
    secondaryTitle: "Sammenligninger og kjopsrad",
    secondaryLinkText: "Se flere tester",
    moreTitle: "Flere tester",
    moreLinkText: "Mer fra testredaksjonen",
    articles: testArticlesData,
  },
  guider: {
    slug: "guider",
    title: "Guider",
    kicker: "Slik gjør du det",
    intro: "Praktiske forklaringer, kjøpsråd og konkrete tips som hjelper deg å velge riktig.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Nye guider",
    latestLinkText: "Se alle guider",
    secondaryTitle: "Flere guider og forklaringer",
    secondaryLinkText: "Se flere guider",
    moreTitle: "Flere nyttige guider",
    moreLinkText: "Mer guider",
    articles: guideArticlesData,
  },
  video: {
    slug: "video",
    title: "Video",
    kicker: "Se teknologien i bruk",
    intro: "Korte tester, demonstrasjoner, gjennomganger og forklaringer fra Tekkno-redaksjonen.",
    heroImage: "/images/placeholders/article-placeholder.svg",
    latestTitle: "Siste videoer",
    latestLinkText: "Se alle videoer",
    secondaryTitle: "Tester og forklaringer pa video",
    secondaryLinkText: "Se flere videoer",
    moreTitle: "Flere videoer",
    moreLinkText: "Mer video",
    articles: [
      ...latestArticles.filter((article) => article.type === "video"),
      aiArticlesData.find((article) => article.type === "video"),
      ...extraArticles.video,
    ],
  },
};

const supplementalStories = {
  gaming: [
    ["Nintendo viser frem sin neste konsoll", "Den nye maskinen far bedre skjerm, raskere lagring og full bakoverkompatibilitet."],
    ["Dette er skjermkortene som gir mest gaming for pengene", "Vi sammenligner ytelse, stromforbruk og pris i de viktigste prisklassene."],
    ["Slik far du jevnere bilder uten a kjop ny PC", "Fem innstillinger kan gi merkbart bedre flyt i spillene du allerede spiller."],
    ["De beste indiespillene du kanskje har oversett", "Sma utviklere leverer noen av arets mest originale spillopplevelser."],
    ["Xbox satser tyngre pa handholdt gaming", "Microsoft vil samle Game Pass og Windows i en ny type spillmaskin."],
    ["Gaming-headsetene som faktisk har god mikrofon", "Vi har lyttet, spilt og snakket oss frem til de beste valgene."],
  ],
  elbil: [
    ["Disse elbilene lader raskest pa langtur", "Forskjellen mellom lovet og faktisk ladefart er stor. Her er modellene som leverer."],
    ["Slik bevarer du batteriet gjennom vinteren", "Enkle ladevaner kan gi bedre rekkevidde og mindre slitasje over tid."],
    ["Nye sma elbiler presser prisene ned", "Flere kompakte modeller er pa vei med priser langt under dagens bestselgere."],
    ["Hjemmelading: Dette bor du sjekke for du bestiller", "Effekt, strømtariff og smartlading avgjor hva losningen faktisk koster."],
    ["Test av ladeapper: En er klart enklest pa tur", "Vi sammenligner dekning, priser og hvor raskt du kommer i gang ved laderen."],
  ],
  gadgets: [
    ["Arets mest nyttige smarthjem-produkter", "Disse dingsene sparer faktisk tid og fungerer uten unodvendig mye vedlikehold."],
    ["Test: Oerepropper med imponerende stoydemping", "Kompakt design, bedre samtalelyd og batteri som holder gjennom arbeidsdagen."],
    ["Mobilene som gir mest for pengene akkurat na", "Du trenger ikke toppmodell for a fa godt kamera, rask skjerm og lang batteritid."],
    ["Slik rydder du opp i et rotete smarthjem", "Samle lys, sensorer og rutiner uten a bytte ut alt du allerede eier."],
    ["De beste laderne for mobil, klokke og PC", "En liten lader kan erstatte hele kabelhaugen i vesken."],
    ["Ny smartklokke lover en uke batteritid", "Bedre sensorer og mer effektiv skjerm skal gi langt sjeldnere lading."],
  ],
  tester: [
    ["Test: Den nye MacBook Air er raskere enn den ser ut", "Lang batteritid og stille drift gjor den til en sterk arbeidsmaskin."],
    ["Test: Robotstovsuger som endelig takler terskler", "Bedre navigasjon og en smartere basestasjon gir mindre manuelt arbeid."],
    ["Test: Rimelig OLED-skjerm for gaming", "Hoy oppdateringsfrekvens og dyp kontrast til en pris flere kan leve med."],
    ["Test: Denne mobilen har arets beste batteri", "To dager mellom hver lading uten at ytelsen er skrudd ned."],
    ["Test: Stoydempende hodetelefoner for kontoret", "Komfort, mikrofon og ro i apent landskap er viktigere enn maksimal bass."],
    ["Test: Kompakt elbil med overraskende god plass", "Smart kupe og lavt forbruk veier opp for moderat hurtiglading."],
  ],
  guider: [
    ["Slik velger du riktig mobilabonnement", "Finn datamengden du faktisk trenger og unnga tilleggene som drar opp prisen."],
    ["Kom i gang med passordnokler", "Den nye innloggingsmetoden er enklere og sikrere enn tradisjonelle passord."],
    ["Slik sikkerhetskopierer du bilder uten stress", "En enkel plan beskytter minnene dine hvis mobilen blir borte eller odelegges."],
    ["Guide: Fa bedre tradlost nett i hele huset", "Riktig plassering og noen fa innstillinger kan lose de vanligste problemene."],
    ["Dette betyr symbolene pa den nye laderen", "Watt, USB-C PD og kabelmerking forklart uten unodvendig fagsprak."],
    ["Slik rydder du opp i varsler pa mobilen", "Behold det viktige og fjern avbrytelsene som stjeler oppmerksomheten."],
  ],
  video: [
    ["Video: Vi tester arets raskeste elbillader", "Se hele ladeforlopet og hva som skjer nar batteriet passerer 80 prosent."],
    ["Video: Fem smarte mobilgrep pa ett minutt", "Korte tips som gjor kamera, batteri og varsler enklere a bruke."],
    ["Video: Slik fungerer en AI-PC", "Vi viser hva som skjer lokalt pa maskinen og hva som fortsatt sendes til skyen."],
    ["Video: Inne i redaksjonens testlab", "Bli med bak kulissene nar vi maler skjerm, batteri og ytelse."],
    ["Video: Forsteinntrykk av ny handholdt spill-PC", "Skjerm, kontroller og spillytelse testet pa farten."],
    ["Video: Tre feil nesten alle gjor med hjemmenettet", "Sma endringer i plassering og oppsett kan gi stor forskjell."],
  ],
};

function buildSupplementalStories(slug, baseArticles) {
  const sourceImages = baseArticles.map((article) => article.image).filter(Boolean);

  return (supplementalStories[slug] || []).map(([title, excerpt], index) => ({
    id: `${slug}-supplemental-${index + 1}`,
    title,
    excerpt,
    category: categoryPages[slug].title,
    tag: categoryPages[slug].title,
    comments: 18 + index * 11,
    reactions: 18 + index * 11,
    type: slug === "video" ? "video" : "standard",
    duration: slug === "video" ? `0${index + 2}:${index % 2 === 0 ? "18" : "42"}` : undefined,
    image: sourceImages[index % sourceImages.length] || categoryPages[slug].heroImage,
  }));
}

function toReel(article, index) {
  return {
    id: `category-reel-${article.id || index}`,
    title: article.title,
    views: article.views || String(article.comments || 0),
    duration: article.duration || "0:30",
    image: article.image,
  };
}

export default function CategoryPage({ slug, payloadCategoryPage = null }) {
  const page = categoryPages[slug];
  if (!page) return null;

  const linkedArticles = page.articles.filter(Boolean).map((article) =>
    withArticleHref({
      ...article,
      category: page.title,
      tag: page.title,
    }),
  );
  const articles = [
    ...linkedArticles,
    ...buildSupplementalStories(slug, linkedArticles),
  ];
  const reelArticles = payloadCategoryPage?.articles?.length
    ? payloadCategoryPage.articles.map(withArticleHref)
    : articles;
  const reels = reelArticles
    .slice(0, 6)
    .map(toReel);

  return (
    <AiNewspaperPage
      categoryConfig={page}
      legacyStories={articles.slice(0, 7)}
      legacyLatestStories={articles.slice(0, 11)}
      legacySecondaryStories={articles.slice(7, 11)}
      payloadCategoryPage={payloadCategoryPage}
      payloadMode={Boolean(payloadCategoryPage)}
      reels={reels}
    />
  );
}
