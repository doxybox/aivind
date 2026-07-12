import { hasActiveEntitlement } from "./authz-core.js";

const FORBIDDEN_PROFILE_FIELDS = new Set([
  "userId",
  "user_id",
  "created_by_id",
  "role",
  "roles",
  "subscription",
  "entitlement",
  "entitlements",
  "premiumAccess",
  "premium_access",
]);

export function getSessionUserId(session) {
  return session?.user?.id || null;
}

export function canReadAccountOverview(session) {
  return Boolean(getSessionUserId(session));
}

export function resolveAccountDataUserId(session) {
  return getSessionUserId(session);
}

export function stripForbiddenProfileFields(input = {}) {
  return Object.fromEntries(Object.entries(input).filter(([key]) => !FORBIDDEN_PROFILE_FIELDS.has(key)));
}

export function hasPremiumAccountAccess({ hasActiveSubscription = false, entitlements = [] } = {}, now = new Date()) {
  return Boolean(
    hasActiveSubscription ||
    hasActiveEntitlement(entitlements, ["premium", "premium_articles"], now),
  );
}
