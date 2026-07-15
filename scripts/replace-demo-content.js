import nextEnv from "@next/env";
import { getPayloadClient } from "../src/lib/server/payload-client.js";

nextEnv.loadEnvConfig(process.cwd());

const APPLY = process.argv.includes("--apply");
const ALLOW_CONTENT_REPLACEMENT = process.env.ALLOW_EDITORIAL_STARTER_CONTENT === "true";
const FUTURE_MINUTES = Number(process.env.EDITORIAL_FUTURE_PUBLISH_MINUTES || 15);

const starterContent = {
  categoryUpdates: [
    {
      slug: "ai",
      name: "AI",
      description: "Nyheter, guider og analyser om kunstig intelligens og hvordan teknologien påvirker hverdagen.",
      existingRoute: "/ai",
      seoTitle: "AI | TEKKNO",
      seoDescription: "Nyheter, guider og analyser om kunstig intelligens.",
      sortOrder: 5,
      isActive: true,
    },
    {
      slug: "gaming",
      name: "Gaming",
      description: "Spill, spillkultur og utstyret som former måten vi spiller på.",
      existingRoute: "/gaming",
      seoTitle: "Gaming | TEKKNO",
      seoDescription: "Spillnyheter, guider og tester fra TEKKNO.",
      sortOrder: 10,
      isActive: true,
    },
  ],
  author: {
    previousSlug: "demo-redaksjonen",
    slug: "tekkno-redaksjon",
    name: "TEKKNO Redaksjon",
    title: "Redaksjonen",
    bio: "TEKKNOs redaksjon dekker teknologi, AI, gaming og digital hverdag.",
    isActive: true,
  },
  articles: [
    {
      previousSlug: "demo-payload-driver-ai-forsiden",
      slug: "slik-bruker-du-ai-mer-bevisst-i-hverdagen",
      title: "Slik bruker du AI mer bevisst i hverdagen",
      excerpt: "AI-verktøy kan spare tid, men gir mest verdi når du vet hva de skal brukes til og hva du fortsatt må vurdere selv.",
      content: `Kunstig intelligens har blitt en del av mange digitale tjenester. Den kan hjelpe oss med å sortere informasjon, komme i gang med en tekst eller få oversikt over et tema. Det betyr ikke at alle oppgaver bør overlates til et verktøy.

Et godt utgangspunkt er å bruke AI til forarbeid. Be om forslag, struktur eller alternative formuleringer, og bruk deretter egen vurdering før noe deles eller tas i bruk.

Vær særlig nøye når oppgaven handler om personopplysninger, økonomi eller informasjon som må være helt korrekt. AI kan være et nyttig hjelpemiddel, men den bør ikke være den eneste kilden.

Den enkleste regelen er også den viktigste: Still tydelige spørsmål, kontroller viktige påstander og behold ansvaret for beslutningen selv.`,
      categorySlug: "ai",
      accessLevel: "public",
      paywallEnabled: false,
      isFeatured: true,
      newsletterEligible: true,
      seoTitle: "Slik bruker du AI mer bevisst i hverdagen | TEKKNO",
      seoDescription: "En praktisk introduksjon til trygg og bevisst bruk av AI-verktøy.",
    },
    {
      previousSlug: "demo-ai-medlemssak-fra-payload",
      slug: "fem-vaner-som-gir-bedre-kontroll-pa-nett",
      title: "Fem vaner som gir bedre kontroll på nett",
      excerpt: "Små valg i hverdagen kan gjøre det enklere å beskytte kontoer, holde oversikt og bruke digitale tjenester med mer ro.",
      content: `Digitale tjenester blir enklere å bruke når du har en fast måte å håndtere dem på. Start med å rydde i kontoene du ikke lenger bruker, og bruk unike passord i en passordtjeneste du stoler på.

Deretter kan du gå gjennom hvilke varsler som faktisk er nyttige. Mindre støy gjør det enklere å oppdage det som krever oppmerksomhet.

Det er også lurt å kontrollere hvilke apper som har tilgang til bilder, kontakter og posisjon. Tilganger kan justeres senere, og du trenger sjelden å gi mer enn det tjenesten faktisk trenger.

Målet er ikke å gjøre alt perfekt. Målet er å skape vaner som gjør teknologien lettere å ha oversikt over.`,
      categorySlug: "ai",
      accessLevel: "members",
      paywallEnabled: false,
      isFeatured: false,
      newsletterEligible: true,
      seoTitle: "Fem vaner som gir bedre kontroll på nett | TEKKNO",
      seoDescription: "Praktiske digitale vaner for en tryggere og mer oversiktlig hverdag.",
    },
    {
      previousSlug: "demo-ai-paywall-skjuler-fulltekst",
      slug: "en-praktisk-metode-for-a-velge-ai-verktoy-pa-jobb",
      title: "En praktisk metode for å velge AI-verktøy på jobb",
      excerpt: "Før et nytt verktøy tas i bruk, bør teamet avklare behov, data, ansvar og hvordan kvaliteten skal kontrolleres.",
      content: `Når et team vurderer et AI-verktøy, er det lett å starte med funksjonslisten. Et bedre første spørsmål er hvilket problem verktøyet faktisk skal løse.

Beskriv oppgaven konkret og avklar hvilken informasjon som kan brukes. Data som er interne, personlige eller sensitive må håndteres etter virksomhetens egne rutiner før de legges inn i en ekstern tjeneste.

Lag deretter en liten prøveperiode med tydelige kriterier. Mål om verktøyet sparer tid, forbedrer kvaliteten eller bare flytter arbeidet til et annet sted.

Til slutt må noen eie vurderingen. AI kan foreslå, oppsummere og strukturere, men det er fortsatt mennesker som har ansvar for resultatet.`,
      categorySlug: "ai",
      accessLevel: "paid",
      paywallEnabled: true,
      isFeatured: false,
      newsletterEligible: false,
      seoTitle: "En praktisk metode for å velge AI-verktøy på jobb | TEKKNO",
      seoDescription: "En strukturert metode for å vurdere AI-verktøy i små og store team.",
    },
    {
      previousSlug: "demo-ai-draft-skal-ikke-lekke",
      slug: "slik-vurderer-vi-nye-digitale-tjenester",
      title: "Slik vurderer vi nye digitale tjenester",
      excerpt: "En redaksjonell kladd for gjennomgang før publisering.",
      content: `Denne saken er en kladd og brukes for å kontrollere at upublisert redaksjonelt innhold ikke er synlig for publikum.

Før publisering skal tittel, ingress, kildegrunnlag og rettigheter gjennomgås av redaksjonen.`,
      categorySlug: "ai",
      status: "draft",
      accessLevel: "public",
      paywallEnabled: false,
      isFeatured: false,
      newsletterEligible: false,
      seoTitle: "Slik vurderer vi nye digitale tjenester | TEKKNO",
      seoDescription: "Kladd for redaksjonell gjennomgang.",
    },
    {
      previousSlug: "demo-ai-future-skal-ikke-lekke",
      slug: "nar-teknologien-blir-mindre-synlig",
      title: "Når teknologien blir mindre synlig",
      excerpt: "En planlagt sak som brukes til å kontrollere at fremtidig publisering skjer på riktig tidspunkt.",
      content: `God teknologi trenger ikke alltid å kreve oppmerksomhet. Når tjenester fungerer godt, oppleves de ofte som en rolig støtte i stedet for et avbrudd.

Denne saken er planlagt for fremtidig publisering. Den skal ikke vises offentlig før tidspunktet som er satt i Payload er passert.`,
      categorySlug: "ai",
      status: "published",
      accessLevel: "public",
      paywallEnabled: false,
      isFeatured: false,
      newsletterEligible: true,
      seoTitle: "Når teknologien blir mindre synlig | TEKKNO",
      seoDescription: "En planlagt artikkel for QA av fremtidig publisering.",
      futurePublished: true,
    },
    {
      previousSlug: "demo-gamingkategori-fra-payload",
      slug: "slik-velger-du-spillutstyr-som-passer-hverdagen",
      title: "Slik velger du spillutstyr som passer hverdagen",
      excerpt: "Det beste spillutstyret er ikke alltid det dyreste. Start med komfort, bruksmønster og hva du faktisk spiller.",
      content: `Spillutstyr handler ofte om detaljer: hvordan noe ligger i hånden, hvor enkelt det er å koble til og om det passer plassen du har hjemme.

Begynn med det du bruker mest. For noen er det en god skjerm, for andre et behagelig headset eller en kontroller som fungerer like godt i sofaen som ved skrivebordet.

Det er også verdt å se etter utstyr som varer. Enkle reservedeler, ryddig programvare og god støtte kan være viktigere enn en lang funksjonsliste.

Det riktige valget er det som gjør det enklere å spille på din måte.`,
      categorySlug: "gaming",
      accessLevel: "public",
      paywallEnabled: false,
      isFeatured: false,
      newsletterEligible: true,
      seoTitle: "Slik velger du spillutstyr som passer hverdagen | TEKKNO",
      seoDescription: "En rolig guide til å velge spillutstyr ut fra egne behov.",
    },
  ],
};

function assertRunAllowed() {
  if (!APPLY) {
    throw new Error("Dry run only. Pass --apply after reviewing the starter content in this script.");
  }

  if (!ALLOW_CONTENT_REPLACEMENT) {
    throw new Error("Set ALLOW_EDITORIAL_STARTER_CONTENT=true to replace the existing demo content.");
  }

  if (!Number.isFinite(FUTURE_MINUTES) || FUTURE_MINUTES < 5 || FUTURE_MINUTES > 1440) {
    throw new Error("EDITORIAL_FUTURE_PUBLISH_MINUTES must be between 5 and 1440.");
  }
}

async function findOne(payload, collection, slug) {
  const result = await payload.find({
    collection,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  });

  return result.docs?.[0] || null;
}

async function updateOrCreateBySlug(payload, collection, { previousSlug, slug, data }) {
  const existing = await findOne(payload, collection, previousSlug || slug) || await findOne(payload, collection, slug);

  if (existing) {
    return {
      action: "updated",
      doc: await payload.update({ collection, id: existing.id, overrideAccess: true, data: { ...data, slug } }),
    };
  }

  return {
    action: "created",
    doc: await payload.create({ collection, overrideAccess: true, data: { ...data, slug } }),
  };
}

async function updateFrontpageHero(payload, articleId) {
  const existing = await payload.find({
    collection: "frontpage-slots",
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { slotName: { equals: "Forside hero" } },
  });

  const data = {
    label: "Forside hero",
    slotName: "Forside hero",
    slot: "hero-main",
    placement: "hero",
    article: articleId,
    priority: 1,
    position: 1,
    isActive: true,
  };

  if (existing.docs?.[0]) {
    return {
      action: "updated",
      doc: await payload.update({ collection: "frontpage-slots", id: existing.docs[0].id, overrideAccess: true, data }),
    };
  }

  return {
    action: "created",
    doc: await payload.create({ collection: "frontpage-slots", overrideAccess: true, data }),
  };
}

async function main() {
  assertRunAllowed();

  const payload = await getPayloadClient();
  const now = new Date();
  const futurePublishedAt = new Date(now.getTime() + FUTURE_MINUTES * 60 * 1000).toISOString();

  const categoryResults = [];
  for (const category of starterContent.categoryUpdates) {
    categoryResults.push(await updateOrCreateBySlug(payload, "categories", {
      slug: category.slug,
      data: category,
    }));
  }

  const categoriesBySlug = new Map(categoryResults.map((result) => [result.doc.slug, result.doc]));
  const { previousSlug: previousAuthorSlug, slug: authorSlug, ...authorData } = starterContent.author;
  const authorResult = await updateOrCreateBySlug(payload, "authors", {
    previousSlug: previousAuthorSlug,
    slug: authorSlug,
    data: authorData,
  });

  const articleResults = [];
  for (const article of starterContent.articles) {
    const category = categoriesBySlug.get(article.categorySlug);
    if (!category) throw new Error(`Missing category for ${article.slug}`);

    const { previousSlug, categorySlug, futurePublished, ...articleData } = article;
    const publishedAt = articleData.status === "draft"
      ? null
      : futurePublished
        ? futurePublishedAt
        : new Date(now.getTime() - articleResults.length * 60 * 1000).toISOString();

    articleResults.push(await updateOrCreateBySlug(payload, "articles", {
      previousSlug,
      slug: article.slug,
      data: {
        ...articleData,
        status: articleData.status || "published",
        publishedAt,
        scheduledAt: futurePublished ? futurePublishedAt : null,
        authors: [authorResult.doc.id],
        categories: [category.id],
      },
    }));
  }

  const heroArticle = articleResults.find((result) => result.doc.slug === "slik-bruker-du-ai-mer-bevisst-i-hverdagen");
  const frontpageSlot = await updateFrontpageHero(payload, heroArticle.doc.id);

  console.log(JSON.stringify({
    ok: true,
    futurePublishedAt,
    categories: categoryResults.map((result) => ({ action: result.action, slug: result.doc.slug })),
    author: { action: authorResult.action, slug: authorResult.doc.slug },
    articles: articleResults.map((result) => ({ action: result.action, slug: result.doc.slug, status: result.doc.status })),
    frontpageSlot: { action: frontpageSlot.action, slotName: frontpageSlot.doc.slotName, article: heroArticle.doc.slug },
  }, null, 2));
}

main().catch((error) => {
  console.error("[replace-demo-content]", error?.message || error);
  process.exit(1);
});
