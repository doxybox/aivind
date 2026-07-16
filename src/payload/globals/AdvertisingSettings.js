import { adManagersOnly } from "../access/roles.js";

const SLOT_FIELDS = [
  "homePrimary",
  "homeSecondary",
  "categoryBottom",
  "articleSidebarTop",
  "articleSidebarBottom",
];

function validatePublisherId(value) {
  if (!value) return true;
  return /^ca-pub-\d{10,20}$/.test(value) || "Bruk AdSense Publisher ID i formatet ca-pub-1234567890.";
}

function validateSlotId(value) {
  if (!value) return true;
  return /^\d{6,20}$/.test(value) || "Bruk kun det numeriske slot-ID-et fra AdSense.";
}

function validateEnabledSettings({ data }) {
  if (!data?.adsenseEnabled) return data;

  if (!data.adsenseClient) {
    throw new Error("Legg inn Publisher ID før AdSense aktiveres.");
  }

  const slots = data.slots || {};
  if (!SLOT_FIELDS.some((field) => slots[field])) {
    throw new Error("Legg inn minst én AdSense slot-ID før annonser aktiveres.");
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
        description: "Slå bare på etter at nettstedet er godkjent i AdSense, CMP/samtykke er på plass og ads.txt er publisert.",
      },
    },
    {
      name: "adsenseClient",
      label: "AdSense Publisher ID",
      type: "text",
      validate: validatePublisherId,
      admin: {
        placeholder: "ca-pub-1234567890123456",
        description: "Offentlig publisher-ID fra AdSense. Dette er ikke en API-nøkkel.",
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
