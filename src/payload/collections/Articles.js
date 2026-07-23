import { editorsOnly, staffOnly } from "../access/roles.js";
import { ValidationError } from "payload";

function hasEditorialValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
}

function syncEditorialPublicationState({ data, originalDoc, req }) {
  if (!data) return data;

  if (data._status === "published") {
    data.status = "published";
    if (!data.publishedAt) data.publishedAt = originalDoc?.publishedAt || new Date().toISOString();
  }

  const nextDoc = { ...originalDoc, ...data };
  const isTransitionToPublished = nextDoc.status === "published" && originalDoc?.status !== "published";
  if (!isTransitionToPublished) return data;

  const requiredFields = [
    ["title", "Legg inn en tittel før publisering."],
    ["slug", "Legg inn en slug før publisering."],
    ["excerpt", "Legg inn en ingress før publisering."],
    ["content", "Legg inn artikkeltekst før publisering."],
    ["authors", "Velg minst én forfatter før publisering."],
    ["categories", "Velg minst én kategori før publisering."],
    ["seoTitle", "Legg inn en SEO-tittel før publisering."],
    ["seoDescription", "Legg inn en SEO-beskrivelse før publisering."],
  ];

  const errors = requiredFields
    .filter(([field]) => !hasEditorialValue(nextDoc[field]))
    .map(([path, message]) => ({ path, message }));

  if (errors.length > 0) {
    throw new ValidationError({
      collection: "articles",
      errors,
      req,
    });
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
