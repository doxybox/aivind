export function hasRole(roles, role) {
  return Array.isArray(roles) && roles.includes(role);
}

export function hasAnyRole(roles, rolesToAllow) {
  return Array.isArray(roles) && Array.isArray(rolesToAllow) && roles.some((role) => rolesToAllow.includes(role));
}

export function isActiveWindow({ active = true, startsAt = null, endsAt = null }, now = new Date()) {
  if (!active) return false;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt <= now) return false;
  return true;
}

export function isSubscriptionActive(row, now = new Date()) {
  if (!row) return false;
  if (!["active", "trialing"].includes(row.status)) return false;
  if (row.currentPeriodStart && row.currentPeriodStart > now) return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd <= now) return false;
  return true;
}

export function hasActiveEntitlement(entitlements, types, now = new Date()) {
  const allowedTypes = Array.isArray(types) ? types : [types];
  return (entitlements || []).some((row) => allowedTypes.includes(row.type) && isActiveWindow(row, now));
}
