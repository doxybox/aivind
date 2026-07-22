import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { entitlement, subscription, userRole } from "@/db/schema";
import { hasActiveEntitlement, hasAnyRole, hasRole } from "@/lib/server/authz-core";

export { hasActiveEntitlement, hasAnyRole, hasRole, isActiveWindow, isSubscriptionActive } from "@/lib/server/authz-core";

export class AuthRequiredError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthRequiredError";
    this.status = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

export function headersFromRequest(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req?.headers || {})) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

export async function getCurrentSession(req) {
  return auth.api.getSession({
    headers: headersFromRequest(req),
  });
}

export async function getCurrentUser(req) {
  const session = await getCurrentSession(req);
  return session?.user || null;
}

export async function requireAuth(req) {
  const session = await getCurrentSession(req);

  if (!session?.user) {
    throw new AuthRequiredError();
  }

  return session;
}

export async function getUserRoles(userId) {
  if (!userId) return [];

  const rows = await db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId));
  return rows.map((row) => row.role);
}

export async function requireRole(req, role) {
  const session = await requireAuth(req);
  const roles = await getUserRoles(session.user.id);

  if (!hasRole(roles, role)) {
    throw new ForbiddenError(`Required role: ${role}`);
  }

  return { session, roles };
}

export async function requireAnyRole(req, rolesToAllow) {
  const session = await requireAuth(req);
  const roles = await getUserRoles(session.user.id);

  if (!hasAnyRole(roles, rolesToAllow)) {
    throw new ForbiddenError(`Required one of: ${rolesToAllow.join(", ")}`);
  }

  return { session, roles };
}

export async function requireAdmin(req) {
  return requireRole(req, "admin");
}

export async function getUserEntitlements(userId) {
  if (!userId) return [];

  const now = new Date();

  return db
    .select()
    .from(entitlement)
    .where(
      and(
        eq(entitlement.userId, userId),
        eq(entitlement.active, true),
        or(isNull(entitlement.startsAt), lte(entitlement.startsAt, now)),
        or(isNull(entitlement.endsAt), gt(entitlement.endsAt, now)),
      ),
    );
}

export async function userHasActiveSubscription(userId) {
  if (!userId) return false;

  const now = new Date();
  const rows = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, ["active", "trialing"]),
        or(isNull(subscription.currentPeriodStart), lte(subscription.currentPeriodStart, now)),
        or(isNull(subscription.currentPeriodEnd), gt(subscription.currentPeriodEnd, now)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getUserEntitlementSummary(userId) {
  if (!userId) {
    return {
      isSubscriber: false,
      canReadPremium: false,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    };
  }

  const [activeEntitlements, rows] = await Promise.all([
    getUserEntitlements(userId),
    db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.updatedAt))
      .limit(1),
  ]);
  const latestSubscription = rows[0] || null;
  const isSubscriber = await userHasActiveSubscription(userId);

  return {
    isSubscriber,
    canReadPremium: isSubscriber || hasActiveEntitlement(activeEntitlements, ["premium", "premium_articles"]),
    subscriptionStatus: latestSubscription?.status || null,
    currentPeriodEnd: latestSubscription?.currentPeriodEnd || null,
  };
}

export async function canAccessPremiumArticle(userId, articleId) {
  if (!userId) return false;

  const summary = await getUserEntitlementSummary(userId);
  if (summary.isSubscriber) {
    return true;
  }

  const activeEntitlements = await getUserEntitlements(userId);
  const articleEntitlement = articleId ? `premium_article:${articleId}` : null;

  return hasActiveEntitlement(activeEntitlements, ["premium", "premium_articles", articleEntitlement].filter(Boolean));
}

export function redirectForAuthError(error) {
  if (error instanceof AuthRequiredError || error?.status === 401) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  if (error instanceof ForbiddenError || error?.status === 403) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  throw error;
}
