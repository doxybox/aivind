import { adManagersOnly, editorsOnly } from "../access/roles.js";

export const AdCampaigns = {
  slug: "ad-campaigns",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "placement", "startsAt", "endsAt", "isActive"],
  },
  access: {
    read: adManagersOnly,
    create: adManagersOnly,
    update: adManagersOnly,
    delete: editorsOnly,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "placement", type: "text", required: true },
    { name: "mediaAsset", type: "relationship", relationTo: "media-assets" },
    { name: "targetUrl", type: "text", required: true },
    { name: "startsAt", type: "date" },
    { name: "endsAt", type: "date" },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
