import { canReadPublishedOrStaff, editorsOnly, staffOnly } from "../access/roles.js";

export const Reels = {
  slug: "reels",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "isActive", "publishedAt"],
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
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
    },
    { name: "mediaAsset", type: "relationship", relationTo: "media-assets", required: true },
    { name: "article", type: "relationship", relationTo: "articles" },
    { name: "cloudflareStreamUid", type: "text", index: true },
    { name: "description", type: "textarea" },
    { name: "publishedAt", type: "date" },
    { name: "isActive", type: "checkbox", defaultValue: false },
  ],
};
