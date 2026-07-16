import { editorsOnly, staffOnly } from "../access/roles.js";

function stampModeration({ data, originalDoc, req }) {
  const statusChanged = data.status && data.status !== originalDoc?.status;

  if (statusChanged && ["published", "hidden", "rejected"].includes(data.status)) {
    data.moderatedAt = new Date().toISOString();
    data.moderatedBy = req.user?.email || req.user?.name || "";
  }

  if (data.isEditorialReply && !data.authorName) {
    data.authorName = "TEKKNO Redaksjon";
  }

  return data;
}

export const ArticleComments = {
  slug: "article-comments",
  admin: {
    useAsTitle: "authorName",
    defaultColumns: ["authorName", "articleSlug", "status", "isEditorialReply", "createdAt"],
    description: "Leserkommentarer kommer inn som Avventer. Publiser, skjul eller avvis dem her. For redaksjonssvar: opprett en ny kommentar, velg forelder og marker den som redaksjonssvar.",
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  hooks: {
    beforeChange: [stampModeration],
  },
  fields: [
    {
      name: "article",
      label: "Artikkel i Payload",
      type: "relationship",
      relationTo: "articles",
      index: true,
      admin: {
        description: "Velg artikkel når den finnes i Payload. Feltet gjør at kommentarer følger artikkelen ved slug-endring.",
      },
    },
    {
      name: "articleSlug",
      label: "Artikkel-slug",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "Brukes for kommentarer til både Payload- og legacy-artikler.",
      },
    },
    {
      name: "userId",
      label: "Better Auth-bruker",
      type: "text",
      index: true,
      admin: {
        readOnly: true,
        description: "Settes server-side for leserkommentarer. Står tomt for redaksjonelle svar.",
      },
    },
    { name: "authorName", label: "Visningsnavn", type: "text", required: true },
    { name: "body", label: "Kommentar", type: "textarea", required: true },
    {
      name: "status",
      label: "Modereringsstatus",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Avventer moderering", value: "pending" },
        { label: "Publisert", value: "published" },
        { label: "Skjult", value: "hidden" },
        { label: "Avvist", value: "rejected" },
      ],
    },
    {
      name: "parentComment",
      label: "Svar på kommentar",
      type: "relationship",
      relationTo: "article-comments",
      index: true,
      admin: {
        description: "Velg kommentaren redaksjonen svarer på. La feltet stå tomt for en vanlig kommentar.",
      },
    },
    {
      name: "isEditorialReply",
      label: "Redaksjonssvar",
      type: "checkbox",
      defaultValue: false,
    },
    { name: "moderationNote", label: "Intern modereringsnote", type: "textarea" },
    {
      name: "moderatedBy",
      label: "Moderert av",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "moderatedAt",
      label: "Moderert tidspunkt",
      type: "date",
      admin: { readOnly: true },
    },
  ],
};
