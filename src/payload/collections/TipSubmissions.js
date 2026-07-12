import { editorsOnly, staffOnly } from "../access/roles.js";

export const TipSubmissions = {
  slug: "tip-submissions",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "status", "riskLevel", "assignedTo", "updatedAt"],
  },
  access: {
    read: staffOnly,
    create: () => true,
    update: staffOnly,
    delete: editorsOnly,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "message", type: "textarea", required: true },
    { name: "category", type: "text" },
    { name: "submittedByName", type: "text" },
    { name: "submittedByEmail", type: "email" },
    { name: "phone", type: "text" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "Reviewing", value: "reviewing" },
        { label: "Contacted", value: "contacted" },
        { label: "Rejected", value: "rejected" },
        { label: "Converted to story", value: "converted_to_story" },
      ],
    },
    { name: "assignedTo", type: "relationship", relationTo: "payload-users" },
    { name: "relatedArticle", type: "relationship", relationTo: "articles" },
    { name: "internalNotes", type: "textarea" },
    {
      name: "riskLevel",
      type: "select",
      required: true,
      defaultValue: "low",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
    },
  ],
};
