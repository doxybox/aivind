import { getUserEntitlements, getUserRoles, userHasActiveSubscription } from "./auth-helpers.js";
import { resolveArticleAccess } from "./article-access-core.js";

export {
  GLOBAL_PREMIUM_ENTITLEMENTS,
  STAFF_ARTICLE_ROLES,
  getArticleAccessLevel,
  getArticleEntitlementKeys,
  resolveArticleAccess,
} from "./article-access-core.js";

export async function getArticleAccessForUser(user, article) {
  if (!user?.id) {
    return resolveArticleAccess({ user: null, article });
  }

  const [roles, entitlements, hasActiveSubscription] = await Promise.all([
    getUserRoles(user.id),
    getUserEntitlements(user.id),
    userHasActiveSubscription(user.id),
  ]);

  return resolveArticleAccess({
    user,
    article,
    roles,
    entitlements,
    hasActiveSubscription,
  });
}
