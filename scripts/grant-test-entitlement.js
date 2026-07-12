import { db } from "../src/db/client.js";
import { entitlement } from "../src/db/schema.js";

const [, , userId, entitlementKey = "premium", days = "30"] = process.argv;

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to grant test entitlement in production.");
  process.exit(1);
}

if (process.env.ALLOW_TEST_ENTITLEMENT_GRANT !== "true") {
  console.error("Set ALLOW_TEST_ENTITLEMENT_GRANT=true to grant a dev/test entitlement.");
  process.exit(1);
}

if (!userId) {
  console.error("Usage: node scripts/grant-test-entitlement.js <better-auth-user-id> [entitlementKey] [days]");
  process.exit(1);
}

const parsedDays = Number(days);
if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365) {
  console.error("days must be a number between 1 and 365.");
  process.exit(1);
}

const now = new Date();
const endsAt = new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000);

const rows = await db
  .insert(entitlement)
  .values({
    userId,
    type: entitlementKey,
    active: true,
    source: "test_seed",
    startsAt: now,
    endsAt,
    createdAt: now,
    updatedAt: now,
  })
  .returning();

console.log(JSON.stringify({
  ok: true,
  entitlementId: rows[0]?.id,
  userId,
  entitlementKey,
  source: "test_seed",
  endsAt: endsAt.toISOString(),
}, null, 2));
