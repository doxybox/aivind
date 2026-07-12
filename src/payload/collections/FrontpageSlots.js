import { editorsOnly } from "../access/roles.js";

export const FrontpageSlots = {
  slug: "frontpage-slots",
  admin: {
    useAsTitle: "slotName",
    defaultColumns: ["slotName", "placement", "priority", "isActive", "updatedAt"],
  },
  access: {
    read: editorsOnly,
    create: editorsOnly,
    update: editorsOnly,
    delete: editorsOnly,
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      defaultValue: "Frontpage slot",
      admin: {
        hidden: true,
        description: "Legacy database compatibility field. Use slotName for editors.",
      },
    },
    { name: "slotName", type: "text", required: true },
    {
      name: "slot",
      type: "select",
      required: true,
      defaultValue: "hero-main",
      admin: {
        hidden: true,
        description: "Legacy database compatibility field. Use placement and priority for editors.",
      },
      options: [
        { label: "Hero main", value: "hero-main" },
        { label: "Hero secondary", value: "hero-secondary" },
        { label: "Latest", value: "latest" },
        { label: "Reels", value: "reels" },
        { label: "Editorial block", value: "editorial-block" },
      ],
    },
    {
      name: "placement",
      type: "select",
      required: true,
      options: [
        { label: "Hero", value: "hero" },
        { label: "Top story", value: "top_story" },
        { label: "Section feature", value: "section_feature" },
        { label: "Opinion", value: "opinion" },
        { label: "Video", value: "video" },
        { label: "Ad", value: "ad" },
      ],
    },
    { name: "article", type: "relationship", relationTo: "articles" },
    { name: "mediaAsset", type: "relationship", relationTo: "media-assets" },
    { name: "manualTitleOverride", type: "text" },
    { name: "manualExcerptOverride", type: "textarea" },
    { name: "priority", type: "number", required: true, defaultValue: 1, min: 1 },
    {
      name: "position",
      type: "number",
      required: true,
      defaultValue: 1,
      admin: {
        hidden: true,
        description: "Legacy database compatibility field. Use priority for editors.",
      },
    },
    { name: "startsAt", type: "date" },
    { name: "expiresAt", type: "date" },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
