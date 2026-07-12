import { getPayloadClient } from "../src/lib/server/payload-client.js";

const DEMO_PREFIX = "[DEMO]";
const ALLOW_PRODUCTION = process.env.ALLOW_PAYLOAD_DEMO_SEED === "true";
const OPERATION_TIMEOUT_MS = Number(process.env.PAYLOAD_DEMO_SEED_OPERATION_TIMEOUT_MS || 15000);
const VERBOSE = process.env.PAYLOAD_DEMO_SEED_VERBOSE === "true";

function assertSafeEnvironment() {
  if (process.env.NODE_ENV === "production" && !ALLOW_PRODUCTION) {
    throw new Error("Refusing to seed demo content in production without ALLOW_PAYLOAD_DEMO_SEED=true.");
  }
}

async function findOne(payload, collection, where) {
  logStep(`find ${collection}`);
  const result = await withOperationTimeout(
    `find ${collection}`,
    payload.find({
      collection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where,
    }),
  );

  return result.docs?.[0] || null;
}

async function upsertBySlug(payload, collection, slug, data) {
  logStep(`upsert ${collection}:${slug}`);
  const existing = await findOne(payload, collection, {
    slug: {
      equals: slug,
    },
  });

  if (existing) {
    return {
      action: "kept",
      doc: existing,
    };
  }

  const doc = await withOperationTimeout(
    `create ${collection}:${slug}`,
    payload.create({
      collection,
      overrideAccess: true,
      data,
    }),
  );

  return {
    action: "created",
    doc,
  };
}

function withOperationTimeout(label, promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out while running ${label}`)), OPERATION_TIMEOUT_MS);
    }),
  ]);
}

function logStep(message) {
  if (VERBOSE) console.error(`[seed-payload-demo-content] ${message}`);
}

async function createFrontpageSlotIfMissing(payload, articleId, slotName = `${DEMO_PREFIX} AI hero`) {
  const existing = await findOne(payload, "frontpage-slots", {
    slotName: {
      equals: slotName,
    },
  });

  if (existing) {
    return { action: "kept", doc: existing };
  }

  const doc = await withOperationTimeout(
    `create frontpage-slot:${slotName}`,
    payload.create({
      collection: "frontpage-slots",
      overrideAccess: true,
      data: {
        label: slotName,
        slotName,
        slot: "hero-main",
        placement: "hero",
        article: articleId,
        priority: 1,
        position: 1,
        isActive: true,
      },
    }),
  );

  return { action: "created", doc };
}

async function main() {
  assertSafeEnvironment();
  logStep("loading payload client");

  const payload = await getPayloadClient();
  logStep("payload client ready");
  const now = new Date().toISOString();

  const aiCategory = await upsertBySlug(payload, "categories", "ai", {
    name: `${DEMO_PREFIX} AI`,
    slug: "ai",
    description: "Demo category for verifying Payload AI rendering.",
    existingRoute: "/ai",
    sortOrder: 5,
    isActive: true,
  });

  const gamingCategory = await upsertBySlug(payload, "categories", "gaming", {
    name: `${DEMO_PREFIX} Gaming`,
    slug: "gaming",
    description: "Demo category for verifying Payload public rendering.",
    existingRoute: "/gaming",
    sortOrder: 10,
    isActive: true,
  });

  const author = await upsertBySlug(payload, "authors", "demo-redaksjonen", {
    name: `${DEMO_PREFIX} Redaksjonen`,
    slug: "demo-redaksjonen",
    title: "Demo author",
    bio: "Demo author for Payload public rendering verification.",
    isActive: true,
  });

  const articleSeeds = [
    {
      title: `${DEMO_PREFIX} Payload driver AI-forsiden`,
      slug: "demo-payload-driver-ai-forsiden",
      excerpt: "Denne publiserte AI-demoartikkelen brukes til a sjekke /ai, forsiden og artikkelside.",
      content: "Dette er demo-innhold fra Payload.\n\nDet skal vises offentlig nar CONTENT_SOURCE=payload.",
      isFeatured: true,
      categoryIds: [aiCategory.doc.id],
      accessLevel: "public",
    },
    {
      title: `${DEMO_PREFIX} AI-medlemssak fra Payload`,
      slug: "demo-ai-medlemssak-fra-payload",
      excerpt: "Denne saken krever innlogging, men ikke premium-abonnement.",
      content: "Dette innholdet skal vises for innloggede brukere nar server-side tilgang er bekreftet.",
      isFeatured: false,
      categoryIds: [aiCategory.doc.id],
      accessLevel: "members",
    },
    {
      title: `${DEMO_PREFIX} AI-paywall skjuler fulltekst`,
      slug: "demo-ai-paywall-skjuler-fulltekst",
      excerpt: "Ingressen kan vises, men body skal skjules uten server-side tilgang.",
      content: "Denne teksten skal ikke lekke uten entitlement eller abonnement.",
      isFeatured: false,
      categoryIds: [aiCategory.doc.id],
      accessLevel: "paid",
      paywallEnabled: true,
    },
    {
      title: `${DEMO_PREFIX} AI draft skal ikke lekke`,
      slug: "demo-ai-draft-skal-ikke-lekke",
      excerpt: "Denne draften skal ikke vises offentlig.",
      content: "Hvis denne teksten vises offentlig, er publiseringsfilteret feil.",
      status: "draft",
      publishedAt: null,
      isFeatured: false,
      categoryIds: [aiCategory.doc.id],
      accessLevel: "public",
    },
    {
      title: `${DEMO_PREFIX} AI future skal ikke lekke`,
      slug: "demo-ai-future-skal-ikke-lekke",
      excerpt: "Denne planlagte saken skal ikke vises for publiseringstidspunktet.",
      content: "Hvis denne teksten vises offentlig for publiseringstidspunktet, er future-filteret feil.",
      publishedAt: "2099-01-01T12:00:00.000Z",
      isFeatured: false,
      categoryIds: [aiCategory.doc.id],
      accessLevel: "public",
    },
    {
      title: `${DEMO_PREFIX} Gamingkategori fra Payload`,
      slug: "demo-gamingkategori-fra-payload",
      excerpt: "Denne saken bekrefter at /gaming kan hente publisert Payload-innhold.",
      content: "Gamingkategoriens innhold kommer fra Payload i denne demoen.",
      isFeatured: false,
      categoryIds: [gamingCategory.doc.id],
      accessLevel: "public",
    },
  ];

  const articleResults = [];
  for (const seed of articleSeeds) {
    const { categoryIds, ...articleData } = seed;
    articleResults.push(
      await upsertBySlug(payload, "articles", seed.slug, {
        ...articleData,
        status: seed.status || "published",
        publishedAt: seed.publishedAt === null ? null : seed.publishedAt || now,
        authors: [author.doc.id],
        categories: categoryIds,
        accessLevel: seed.accessLevel || "public",
        paywallEnabled: Boolean(seed.paywallEnabled),
      }),
    );
  }

  let slot = { action: "skipped", doc: { slotName: `${DEMO_PREFIX} AI hero` } };
  try {
    slot = await createFrontpageSlotIfMissing(payload, articleResults[0].doc.id);
  } catch (error) {
    console.warn("[seed-payload-demo-content] frontpage slot skipped:", error?.message || error);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Demo Payload content is ready. Set CONTENT_SOURCE=payload and open /, /ai, /gaming and /artikler/demo-payload-driver-ai-forsiden.",
        categories: [
          { action: aiCategory.action, slug: aiCategory.doc.slug },
          { action: gamingCategory.action, slug: gamingCategory.doc.slug },
        ],
        author: { action: author.action, slug: author.doc.slug },
        articles: articleResults.map((result) => ({ action: result.action, slug: result.doc.slug })),
        frontpageSlot: { action: slot.action, slotName: slot.doc.slotName },
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[seed-payload-demo-content]", error?.message || error);
    process.exit(1);
  });
