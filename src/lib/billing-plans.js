export const billingPlans = [
  {
    planKey: "free",
    displayName: "Gratis",
    slug: "free",
    description: "For nybegynnere",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "NOK",
    interval: "free",
    entitlementKey: null,
    vipps: {
      productId: null,
      agreementProductName: "TEKKNO Gratis",
    },
    features: [
      "Les åpne artikler",
      "Lagre artikler",
      "Motta nyhetsbrev",
      "Grunnleggende profilside",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
    ctaText: "Nåværende plan",
  },
  {
    planKey: "premium_monthly",
    displayName: "TEKKNO Premium månedlig",
    slug: "premium_monthly",
    legacySlug: "premium",
    description: "For ekspertene",
    price: 299,
    monthlyPrice: 299,
    yearlyPrice: 2990,
    currency: "NOK",
    interval: "monthly",
    entitlementKey: "premium",
    vipps: {
      productId: "aivind-premium-monthly",
      agreementProductName: "TEKKNO Premium månedlig",
    },
    features: [
      "Alle plussaker",
      "Eksklusive premium-artikler",
      "Dypdykk og longreads",
      "Prioritert support",
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 2,
    ctaText: "Oppgrader månedlig",
  },
  {
    planKey: "premium_yearly",
    displayName: "TEKKNO Premium årlig",
    slug: "premium_yearly",
    legacySlug: "premium",
    description: "For ekspertene som vil betale årlig",
    price: 2990,
    monthlyPrice: 299,
    yearlyPrice: 2990,
    currency: "NOK",
    interval: "yearly",
    entitlementKey: "premium",
    vipps: {
      productId: "aivind-premium-yearly",
      agreementProductName: "TEKKNO Premium årlig",
    },
    features: [
      "Alt i Premium månedlig",
      "Årlig fakturering",
      "Lavere totalpris enn månedlig",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
    ctaText: "Oppgrader årlig",
  },
];

export function getBillingPlan(planKey) {
  return billingPlans.find((plan) => plan.planKey === planKey || plan.slug === planKey);
}

export function getBillingPlanForInterval(interval = "monthly") {
  return getBillingPlan(interval === "yearly" ? "premium_yearly" : "premium_monthly");
}

export function getActiveBillingPlans() {
  return billingPlans.filter((plan) => plan.isActive);
}

export function getBillingPlanPrice(plan) {
  return Number(plan?.price || 0);
}
