import { editorsOnly, staffOnly } from "../access/roles.js";

function hasEditorialValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
}

function syncEditorialPublicationState({ data, originalDoc }) {
  if (!data) return data;

  if (data._status === "published") {
    data.status = "published";
    if (!data.publishedAt) data.publishedAt = originalDoc?.publishedAt || new Date().toISOString();
  }

  const nextDoc = { ...originalDoc, ...data };
  const isTransitionToPublished = nextDoc.status === "published" && originalDoc?.status !== "published";
  if (!isTransitionToPublished) return data;

  const missing = [];
  if (!hasEditorialValue(nextDoc.title)) missing.push("tittel");
  if (!hasEditorialValue(nextDoc.slug)) missing.push("slug");
  if (!hasEditorialValue(nextDoc.excerpt)) missing.push("ingress");
  if (!hasEditorialValue(nextDoc.content)) missing.push("artikkeltekst");
  if (!hasEditorialValue(nextDoc.authors)) missing.push("forfatter");
  if (!hasEditorialValue(nextDoc.categories)) missing.push("kategori");
  if (!hasEditorialValue(nextDoc.seoTitle)) missing.push("SEO-tittel");
  if (!hasEditorialValue(nextDoc.seoDescription)) missing.push("SEO-beskrivelse");

  if (missing.length > 0) {
    throw new Error(`Kan ikke publisere artikkelen ennå. Mangler: ${missing.join(", ")}.`);
  }

  return data;
}

export const Articles = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "accessLevel", "updatedAt"],
    description: "Payload-owned articles. Payload is the source of truth for editorial content.",
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1500,
        showSaveDraftButton: true,
      },
      validate: true,
    },
    maxPerDoc: 50,
  },
  access: {
    // Public pages use server-side Payload loaders with explicit publish and
    // entitlement checks. Raw CMS API access must never bypass the paywall.
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  hooks: {
    beforeChange: [syncEditorialPublicationState],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "excerpt", label: "Ingress", type: "textarea", admin: { description: "Påkrevd når artikkelen publiseres." } },
    { name: "content", label: "Artikkeltekst", type: "textarea", admin: { description: "Påkrevd når artikkelen publiseres." } },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      admin: { description: "Bruk Status for redaksjonell flyt. Planlagt publisering krever en konfigurert jobbkjører og er ikke aktivert ennå." },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Review", value: "review" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
    },
    { name: "publishedAt", type: "date" },
    { name: "scheduledAt", type: "date" },
    { name: "authors", type: "relationship", relationTo: "authors", hasMany: true, required: true, admin: { description: "Påkrevd. Velg en forfatter med et redaksjonelt profilbilde." } },
    { name: "categories", type: "relationship", relationTo: "categories", hasMany: true, admin: { description: "Påkrevd når artikkelen publiseres." } },
    { name: "heroMedia", type: "relationship", relationTo: "media-assets" },
    { name: "seoTitle", label: "SEO-tittel", type: "text", admin: { description: "Påkrevd når artikkelen publiseres. Hold den kort og beskrivende." } },
    { name: "seoDescription", label: "SEO-beskrivelse", type: "textarea", admin: { description: "Påkrevd når artikkelen publiseres." } },
    { name: "seoImage", label: "SEO-bilde", type: "relationship", relationTo: "media-assets" },
    { name: "canonicalUrl", label: "Kanonisk URL", type: "text" },
    { name: "isBreaking", type: "checkbox", defaultValue: false },
    { name: "isFeatured", type: "checkbox", defaultValue: false },
    {
      name: "accessLevel",
      type: "select",
      required: true,
      defaultValue: "public",
      options: [
        { label: "Public", value: "public" },
        { label: "Members", value: "members" },
        { label: "Paid", value: "paid" },
      ],
    },
    {
      name: "commentsEnabled",
      label: "Tillat kommentarer",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Når feltet er av, kan lesere ikke sende inn eller se kommentarer på artikkelen.",
      },
    },
    { name: "newsletterEligible", type: "checkbox", defaultValue: false },
    { name: "paywallEnabled", type: "checkbox", defaultValue: false },
  ],
};
