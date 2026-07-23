import { getPayloadClient } from "./payload-client.js";
import {
  normalizeAdSensePublisherId,
  normalizeAdSenseSlotId,
} from "../adsense-normalization.js";

const SLOT_FIELD_BY_PLACEMENT = {
  "home-primary": "homePrimary",
  "home-secondary": "homeSecondary",
  "category-bottom": "categoryBottom",
  "article-sidebar-top": "articleSidebarTop",
  "article-sidebar-bottom": "articleSidebarBottom",
};

export function toPublicAdSenseSettings(settings = {}) {
  const client = normalizeAdSensePublisherId(settings.adsenseClient);
  const sourceSlots = settings.slots || {};
  const slots = Object.fromEntries(
    Object.entries(SLOT_FIELD_BY_PLACEMENT)
      .map(([placement, field]) => [placement, normalizeAdSenseSlotId(sourceSlots[field])])
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
