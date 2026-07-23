import { adManagersOnly } from "../access/roles.js";
import { ValidationError } from "payload";

const SLOT_FIELDS = [
  "homePrimary",
  "homeSecondary",
  "categoryBottom",
  "articleSidebarTop",
  "articleSidebarBottom",
];

function normalizePublisherId(value) {
  const rawValue = typeof value === "string" ? value.trim().replace(/\s+/g, "") : "";
  const match = rawValue.match(/^(?:client=)?(ca-pub-\d{10,20})$/i);
  return match ? match[1].toLowerCase() : "";
}

function normalizeSlotId(value) {
  const rawValue = typeof value === "string" ? value.trim().replace(/\s+/g, "") : "";
  return /^\d{6,20}$/.test(rawValue) ? rawValue : "";
}

function validatePublisherId(value) {
  if (!value) return true;
  return normalizePublisherId(value) || "Bruk Publisher ID-en fra AdSense, for eksempel ca-pub-1234567890123456.";
}

function validateSlotId(value) {
  if (!value) return true;
  return normalizeSlotId(value) || "Bruk kun det numeriske slot-ID-et fra AdSense.";
}

function validateEnabledSettings({ data, req }) {
  const publisherId = normalizePublisherId(data?.adsenseClient);
  const slots = data?.slots || {};

  if (publisherId) data.adsenseClient = publisherId;
  for (const field of SLOT_FIELDS) {
    const slotId = normalizeSlotId(slots[field]);
    if (slotId) slots[field] = slotId;
  }

  if (!data?.adsenseEnabled) return data;

  const errors = [];
  if (!publisherId) {
    errors.push({ path: "adsenseClient", message: "Legg inn en gyldig Publisher ID før du aktiverer AdSense." });
  }

  if (!SLOT_FIELDS.some((field) => normalizeSlotId(slots[field]))) {
    errors.push({ path: "slots", message: "Legg inn minst én numerisk AdSense slot-ID før du aktiverer annonser." });
  }

  if (errors.length > 0) {
    throw new ValidationError({
      global: "advertising-settings",
      errors,
      req,
    });
  }

  return data;
}

export const AdvertisingSettings = {
  slug: "advertising-settings",
  label: "Annonseinnstillinger",
  admin: {
    group: "Innstillinger",
    description: "Google AdSense for offentlige annonseflater. Direkte solgte kampanjer styres fortsatt i Annonsekampanjer.",
  },
  access: {
    read: adManagersOnly,
    update: adManagersOnly,
  },
  hooks: {
    beforeChange: [validateEnabledSettings],
  },
  fields: [
    {
      name: "adsenseEnabled",
      label: "Aktiver Google AdSense",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Aktiveres først når Publisher ID og minst én slot-ID er lagret. Manglende felt vises med en konkret feilmelding.",
      },
    },
    {
      name: "adsenseClient",
      label: "AdSense Publisher ID",
      type: "text",
      validate: validatePublisherId,
      admin: {
        placeholder: "ca-pub-1234567890123456",
        description: "Lim inn bare Publisher ID-en, eller client=ca-pub-... fra AdSense. Dette er ikke en API-nøkkel.",
      },
    },
    {
      name: "slots",
      label: "AdSense slot-ID-er",
      type: "group",
      fields: [
        { name: "homePrimary", label: "Forside - hovedflate (970 x 250)", type: "text", validate: validateSlotId },
        { name: "homeSecondary", label: "Forside - bunnflate (970 x 250)", type: "text", validate: validateSlotId },
        { name: "categoryBottom", label: "Kategoriside - bunnflate (970 x 250)", type: "text", validate: validateSlotId },
        { name: "articleSidebarTop", label: "Artikkel - sidebar topp (300 x 600)", type: "text", validate: validateSlotId },
        { name: "articleSidebarBottom", label: "Artikkel - sidebar bunn (300 x 250)", type: "text", validate: validateSlotId },
      ],
    },
  ],
};
