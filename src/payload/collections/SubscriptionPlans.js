import { editorsOnly } from "../access/roles.js";

const IMMUTABLE_COMMERCE_FIELDS = ["planKey", "interval"];

function validatePlanKey(value) {
  return /^[a-z0-9][a-z0-9_-]{1,62}$/.test(String(value || ""))
    || "Bruk sma bokstaver, tall, bindestrek eller understrek i plan-nokkelen.";
}

function validatePrice(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0
    || "Pris ma vaere et heltall i NOK og kan ikke vaere negativ.";
}

function lockCommerceIdentity({ data, originalDoc, operation }) {
  if (operation !== "update" || !originalDoc) return data;

  for (const field of IMMUTABLE_COMMERCE_FIELDS) {
    if (data?.[field] !== undefined && data[field] !== originalDoc[field]) {
      throw new Error(`${field} kan ikke endres etter at en abonnementsplan er opprettet.`);
    }
  }

  return data;
}

export const SubscriptionPlans = {
  slug: "subscription-plans",
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "planKey", "interval", "price", "isActive", "checkoutMode"],
    group: "Innstillinger",
    description: "Styr priser, fordeler og synlighet for nye abonnement. Eksisterende abonnement beholder sine lagrede vilkar.",
  },
  access: {
    read: editorsOnly,
    create: editorsOnly,
    update: editorsOnly,
    delete: editorsOnly,
  },
  hooks: {
    beforeChange: [lockCommerceIdentity],
  },
  fields: [
    {
      name: "planKey",
      label: "Plan-nokkel",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: validatePlanKey,
      admin: {
        description: "Teknisk nokkel brukt av betaling og tilgang. Kan ikke endres etter opprettelse.",
      },
    },
    {
      name: "displayGroup",
      label: "Visningsgruppe",
      type: "select",
      required: true,
      options: [
        { label: "Gratis", value: "free" },
        { label: "Pluss", value: "pluss" },
        { label: "Premium", value: "premium" },
        { label: "Familie", value: "familie" },
        { label: "Bedrift", value: "bedrift" },
      ],
      admin: {
        description: "Planer med samme gruppe vises som ett kort med manedlig og arlig valg.",
      },
    },
    { name: "displayName", label: "Navn", type: "text", required: true },
    { name: "description", label: "Kort beskrivelse", type: "textarea" },
    {
      name: "price",
      label: "Pris per periode (NOK)",
      type: "number",
      required: true,
      min: 0,
      validate: validatePrice,
    },
    {
      name: "currency",
      label: "Valuta",
      type: "select",
      required: true,
      defaultValue: "NOK",
      options: [{ label: "NOK", value: "NOK" }],
    },
    {
      name: "interval",
      label: "Faktureringsperiode",
      type: "select",
      required: true,
      options: [
        { label: "Gratis", value: "free" },
        { label: "Manedlig", value: "monthly" },
        { label: "Arlig", value: "yearly" },
      ],
      admin: {
        description: "Kan ikke endres etter opprettelse. Opprett en ny plan hvis perioden ma endres.",
      },
    },
    {
      name: "entitlementKey",
      label: "Tilgangsnokkel",
      type: "text",
      admin: {
        description: "F.eks. premium. Styrer tilgang for nye, bekreftede abonnement. Eksisterende abonnement beholder sin lagrede tilgang.",
      },
    },
    {
      name: "checkoutMode",
      label: "Handling",
      type: "select",
      required: true,
      defaultValue: "unavailable",
      options: [
        { label: "Checkout", value: "checkout" },
        { label: "Kontakt salg", value: "contact" },
        { label: "Ikke tilgjengelig", value: "unavailable" },
      ],
      admin: {
        description: "Betaling startes bare for planer med Checkout. La den sta som Ikke tilgjengelig mens betaling er parkert.",
      },
    },
    {
      name: "features",
      label: "Fordeler",
      type: "array",
      fields: [
        { name: "feature", label: "Fordel", type: "text", required: true },
      ],
    },
    { name: "ctaText", label: "Knappetekst", type: "text" },
    { name: "isPopular", label: "Mest populaer", type: "checkbox", defaultValue: false },
    { name: "isActive", label: "Vis planen offentlig", type: "checkbox", defaultValue: true },
    { name: "sortOrder", label: "Sortering", type: "number", defaultValue: 0 },
    {
      name: "provider",
      label: "Betalingsleverandor (valgfritt)",
      type: "group",
      fields: [
        { name: "vippsProductId", label: "Vipps produkt-ID", type: "text" },
        { name: "vippsAgreementProductName", label: "Vipps avtalenavn", type: "text" },
      ],
    },
  ],
};
