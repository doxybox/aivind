import { editorsOnly, staffOnly } from "../access/roles.js";
import {
  createPayloadMediaAssetDirectUpload,
  createPayloadMediaAssetStreamDirectUpload,
} from "../endpoints/media-assets-cloudflare.js";

export const MediaAssets = {
  slug: "media-assets",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "provider", "type", "status", "updatedAt"],
    components: {
      beforeList: ["./src/payload/components/MediaAssetUploader.jsx"],
    },
  },
  access: {
    // Media inventory and upload metadata are internal editorial data. Public
    // delivery happens through sanitized server-side content loaders instead.
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: editorsOnly,
  },
  endpoints: [
    {
      path: "/cloudflare-direct-upload",
      method: "post",
      handler: createPayloadMediaAssetDirectUpload,
    },
    {
      path: "/cloudflare-stream-direct-upload",
      method: "post",
      handler: createPayloadMediaAssetStreamDirectUpload,
    },
  ],
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "provider",
      type: "select",
      required: true,
      defaultValue: "cloudflare_images",
      options: [
        { label: "Cloudflare Images", value: "cloudflare_images" },
        { label: "Cloudflare Stream", value: "cloudflare_stream" },
        { label: "R2", value: "r2" },
        { label: "External", value: "external" },
      ],
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
        { label: "File", value: "file" },
      ],
    },
    { name: "cloudflareImageId", type: "text", index: true },
    { name: "cloudflareStreamUid", type: "text", index: true },
    { name: "deliveryUrl", type: "text" },
    { name: "thumbnailUrl", type: "text" },
    { name: "originalFilename", type: "text" },
    { name: "width", type: "number" },
    { name: "height", type: "number" },
    { name: "duration", type: "number" },
    { name: "alt", type: "text" },
    { name: "caption", type: "textarea" },
    { name: "credit", type: "text" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Uploading", value: "uploading" },
        { label: "Processing", value: "processing" },
        { label: "Ready", value: "ready" },
        { label: "Failed", value: "failed" },
      ],
    },
    { name: "usageRights", type: "textarea" },
    { name: "uploadedBy", type: "relationship", relationTo: "payload-users" },
    {
      name: "metadata",
      type: "json",
    },
  ],
};
