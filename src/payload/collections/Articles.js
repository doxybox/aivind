import { canReadPublishedOrStaff, editorsOnly, staffOnly } from "../access/roles.js";

export const Articles = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "accessLevel", "updatedAt"],
    description: "Payload-owned articles. Payload is the source of truth for editorial content.",
  },
  access: {
    read: canReadPublishedOrStaff,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "excerpt", label: "Ingress", type: "textarea" },
    { name: "content", label: "Body", type: "textarea" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
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
    { name: "authors", type: "relationship", relationTo: "authors", hasMany: true },
    { name: "categories", type: "relationship", relationTo: "categories", hasMany: true },
    { name: "heroMedia", type: "relationship", relationTo: "media-assets" },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    { name: "seoImage", type: "relationship", relationTo: "media-assets" },
    { name: "canonicalUrl", type: "text" },
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
