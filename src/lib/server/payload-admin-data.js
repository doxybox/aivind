import { getPayloadClient } from "./payload-client.js";

export async function getActiveFrontpageSlots({ now = new Date(), limit = 50 } = {}) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: "frontpage-slots",
    depth: 3,
    limit,
    overrideAccess: true,
    sort: "priority",
    where: {
      and: [
        { isActive: { equals: true } },
        {
          or: [
            { startsAt: { exists: false } },
            { startsAt: { equals: null } },
            { startsAt: { less_than_equal: now.toISOString() } },
          ],
        },
        {
          or: [
            { expiresAt: { exists: false } },
            { expiresAt: { equals: null } },
            { expiresAt: { greater_than: now.toISOString() } },
          ],
        },
      ],
    },
  });
}
