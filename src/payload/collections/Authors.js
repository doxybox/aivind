import { editorsOnly, staffOnly } from "../access/roles.js";

export const Authors = {
  slug: "authors",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "title", "isActive"],
    description: "Payload-owned public author and journalist profiles.",
  },
  access: {
    read: () => true,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "bio", type: "textarea" },
    { name: "profileImage", type: "relationship", relationTo: "media-assets" },
    { name: "email", type: "email" },
    { name: "title", label: "Role/title", type: "text" },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
