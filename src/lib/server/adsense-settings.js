import { getPayloadClient } from "./payload-client.js";

const SLOT_FIELD_BY_PLACEMENT = {
  "home-primary": "homePrimary",
  "home-secondary": "homeSecondary",
  "category-bottom": "categoryBottom",
  "article-sidebar-top": "articleSidebarTop",
  "article-sidebar-bottom": "articleSidebarBottom",
};

function normalizePublisherId(value) {
  const publisherId = typeof value === "string" ? value.trim() : "";
  return /^ca-pub-\d{10,20}$/.test(publisherId) ? publisherId : "";
}

function normalizeSlotId(value) {
  const slotId = typeof value === "string" ? value.trim() : "";
  return /^\d{6,20}$/.test(slotId) ? slotId : "";
}

export function toPublicAdSenseSettings(settings = {}) {
  const client = normalizePublisherId(settings.adsenseClient);
  const sourceSlots = settings.slots || {};
  const slots = Object.fromEntries(
    Object.entries(SLOT_FIELD_BY_PLACEMENT)
      .map(([placement, field]) => [placement, normalizeSlotId(sourceSlots[field])])
      .filter(([, slot]) => Boolean(slot)),
  );

  return {
    enabled: Boolean(settings.adsenseEnabled && client && Object.keys(slots).length > 0),
    client,
    slots,
  };
}

export async function getPublicAdSenseSettings() {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({
    slug: "advertising-settings",
    depth: 0,
    overrideAccess: true,
  });

  return toPublicAdSenseSettings(settings);
}
