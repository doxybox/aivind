export function getPlanBySlug(slug, plans = []) {
  const cleanSlug = String(slug || "").trim();
  return Array.isArray(plans) ? plans.find((plan) => plan.slug === cleanSlug) || null : null;
}
