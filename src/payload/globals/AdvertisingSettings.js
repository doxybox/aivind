import { adManagersOnly } from "../access/roles.js";
import { ValidationError } from "payload";
import {
  normalizeAdSensePublisherId,
  normalizeAdSenseSlotId,
} from "../../lib/adsense-normalization.js";

const SLOT_FIELDS = [
  "homePrimary",
  "homeSecondary",
  "categoryBottom",
  "articleSidebarTop",
  "articleSidebarBottom",
];

function validatePublisherId(value) {
  if (!value) return true;
  return normalizeAdSensePublisherId(value)
    || "Publisher ID må ha formatet ca-pub-1234567890123456.";
}

function validateSlotId(value) {
  if (!value) return true;
  return normalizeAdSenseSlotId(value)
    || "Slot-ID skal kun inneholde tallet fra data-ad-slot.";
}

function validateEnabledSettings({ data, req }) {
  if (!data) return data;

  const publisherId = normalizeAdSensePublisherId(data.adsenseClient);
  const slots = { ...(data.slots || {}) };

  if (publisherId) data.adsenseClient = publisherId;
  for (const field of SLOT_FIELDS) {
    const slotId = normalizeAdSenseSlotId(slots[field]);
    if (slotId) slots[field] = slotId;
  }
  data.slots = slots;

  if (!data?.adsenseEnabled) return data;

  const errors = [];
  const hasSlot = SLOT_FIELDS.some((field) => normalizeAdSenseSlotId(slots[field]));

  if (!publisherId || !hasSlot) {
    errors.push({
      path: "adsenseEnabled",
      message: "Legg inn en gyldig AdSense Publisher ID og minst én slot-ID før AdSense kan aktiveres.",
    });
  }
  if (!publisherId) {
    errors.push({ path: "adsenseClient", message: "Publisher ID må ha formatet ca-pub-1234567890123456." });
  }
  if (!hasSlot) {
    errors.push({ path: "slots", message: "Slot-ID skal kun inneholde tallet fra data-ad-slot." });
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
        description: "Slå bare på dette etter at nettstedet er godkjent i Google AdSense, samtykkeløsningen er konfigurert og ads.txt er publisert. Annonser vises kun på plasseringer som har en gyldig slot-ID.",
      },
    },
    {
      name: "adsenseClient",
      label: "AdSense Publisher ID",
      type: "text",
      validate: validatePublisherId,
      admin: {
        placeholder: "ca-pub-1234567890123456",
        description: "Finnes i Google AdSense og starter med «ca-pub-». Lim kun inn Publisher ID-en, ikke hele script-koden eller en API-nøkkel. Verdier som client=ca-pub-... og AdSense-script normaliseres automatisk.",
      },
    },
    {
      name: "slots",
      label: "AdSense annonseplasseringer",
      type: "group",
      admin: {
        description: "Slik finner du slot-ID-en: Gå til Google AdSense → Annonser → Etter annonseenhet. Opprett en annonseenhet og kopier tallet som står i data-ad-slot. Eksempel: data-ad-slot=\"1234567890\" betyr at du skal skrive inn 1234567890. Opprett annonseenheter i Google AdSense og lim kun inn tallet fra data-ad-slot, ikke hele annonsekoden.",
      },
      fields: [
        {
          name: "homePrimary",
          label: "Forside – hovedflate",
          type: "text",
          validate: validateSlotId,
          admin: { placeholder: "1234567890", description: "Anbefalt plassering: bred annonse mellom toppseksjonen og hovedinnholdet. Lim inn tallet fra data-ad-slot for annonseenheten på toppen av forsiden." },
        },
        {
          name: "homeSecondary",
          label: "Forside – bunnflate",
          type: "text",
          validate: validateSlotId,
          admin: { placeholder: "1234567890", description: "Lim inn tallet fra data-ad-slot for annonseenheten nederst på forsiden." },
        },
        {
          name: "categoryBottom",
          label: "Kategoriside – bunnflate",
          type: "text",
          validate: validateSlotId,
          admin: { placeholder: "1234567890", description: "Lim inn tallet fra data-ad-slot for annonseenheten nederst på kategorisider." },
        },
        {
          name: "articleSidebarTop",
          label: "Artikkel – sidebar topp",
          type: "text",
          validate: validateSlotId,
          admin: { placeholder: "1234567890", description: "Lim inn tallet fra data-ad-slot for den øverste annonseenheten i artikkelens sidefelt." },
        },
        {
          name: "articleSidebarBottom",
          label: "Artikkel – sidebar bunn",
          type: "text",
          validate: validateSlotId,
          admin: { placeholder: "1234567890", description: "Lim inn tallet fra data-ad-slot for den nederste annonseenheten i artikkelens sidefelt." },
        },
      ],
    },
  ],
};
