import { hasActiveEntitlement, hasAnyRole } from "./authz-core.js";

export const STAFF_ARTICLE_ROLES = ["admin", "editor", "journalist"];
export const GLOBAL_PREMIUM_ENTITLEMENTS = ["premium", "premium_articles"];

export function getArticleAccessLevel(article = {}) {
  return article.accessLevel || "public";
}

export function getArticleEntitlementKeys(article = {}) {
  return [
    article.id ? `premium_article:${article.id}` : "",
    article.slug ? `premium_article_slug:${article.slug}` : "",
  ].filter(Boolean);
}

export function resolveArticleAccess({
  user = null,
  article = {},
  roles = [],
  entitlements = [],
  hasActiveSubscription = false,
  now = new Date(),
} = {}) {
  const accessLevel = getArticleAccessLevel(article);
  const isPremium = Boolean(article.paywallEnabled || accessLevel === "paid");
  const isMembersOnly = accessLevel === "members" && !isPremium;
  const isRestricted = isPremium || isMembersOnly;

  if (!isRestricted) {
    return {
      accessLevel,
      canReadFullBody: true,
      reason: "public",
      requiredAction: "none",
      isRestricted: false,
      isPremium: false,
      isMembersOnly: false,
    };
  }

  if (!user?.id) {
    return {
      accessLevel,
      canReadFullBody: false,
      reason: isPremium ? "premium_login_required" : "login_required",
      requiredAction: "login",
      isRestricted: true,
      isPremium,
      isMembersOnly,
    };
  }

  if (hasAnyRole(roles, STAFF_ARTICLE_ROLES)) {
    return {
      accessLevel,
      canReadFullBody: true,
      reason: "staff_override",
      requiredAction: "none",
      isRestricted: true,
      isPremium,
      isMembersOnly,
    };
  }

  if (isMembersOnly) {
    return {
      accessLevel,
      canReadFullBody: true,
      reason: "registered_user",
      requiredAction: "none",
      isRestricted: true,
      isPremium: false,
      isMembersOnly: true,
    };
  }

  const entitlementKeys = [
    ...GLOBAL_PREMIUM_ENTITLEMENTS,
    ...getArticleEntitlementKeys(article),
  ];
  const hasEntitlement = hasActiveEntitlement(entitlements, entitlementKeys, now);

  if (hasActiveSubscription || hasEntitlement) {
    return {
      accessLevel,
      canReadFullBody: true,
      reason: hasActiveSubscription ? "active_subscription" : "active_entitlement",
      requiredAction: "none",
      isRestricted: true,
      isPremium: true,
      isMembersOnly: false,
    };
  }

  return {
    accessLevel,
    canReadFullBody: false,
    reason: "subscription_required",
    requiredAction: "subscribe",
    isRestricted: true,
    isPremium: true,
    isMembersOnly: false,
  };
}
