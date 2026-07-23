import { editorsOnly, staffOnly } from "../access/roles.js";

const existingRouteOptions = [
  { label: "/ai", value: "/ai" },
  { label: "/gaming", value: "/gaming" },
  { label: "/elbil", value: "/elbil" },
  { label: "/gadgets", value: "/gadgets" },
  { label: "/tester", value: "/tester" },
  { label: "/guider", value: "/guider" },
  { label: "/video", value: "/video" },
];

export const Categories = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "existingRoute", "sortOrder", "isActive"],
    description: "Payload-owned sections and categories for the newspaper.",
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
    {
      name: "heroMedia",
      label: "Kategori-bilde",
      type: "relationship",
      relationTo: "media-assets",
      filterOptions: {
        type: { equals: "image" },
      },
      admin: {
        description: "Vises i toppen av kategorisiden. Kun bildefiler kan velges. Lar du feltet sta tomt, brukes dagens reservebilde.",
      },
    },
    { name: "parent", type: "relationship", relationTo: "categories" },
    {
      name: "existingRoute",
      type: "select",
      label: "Existing frontend route",
      options: existingRouteOptions,
    },
    { name: "seoTitle", type: "text" },
    { name: "seoDescription", type: "textarea" },
    { name: "sortOrder", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
