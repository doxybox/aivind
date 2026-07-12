import { editorsOnly } from "../access/roles.js";

export const PayloadUsers = {
  slug: "payload-users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    create: editorsOnly,
    read: editorsOnly,
    update: editorsOnly,
    delete: editorsOnly,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["journalist"],
      options: [
        { label: "Journalist", value: "journalist" },
        { label: "Editor", value: "editor" },
        { label: "Admin", value: "admin" },
        { label: "Desk", value: "desk" },
        { label: "Moderator", value: "moderator" },
        { label: "Ad manager", value: "ad_manager" },
      ],
    },
  ],
};
