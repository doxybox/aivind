import { getPayloadClient } from "../src/lib/server/payload-client.js";

const seedPlans = [
  {
    planKey: "free",
    displayGroup: "free",
    displayName: "Gratis",
    description: "For nybegynnere",
    price: 0,
    currency: "NOK",
    interval: "free",
    entitlementKey: "",
    checkoutMode: "unavailable",
    features: ["Les apne artikler", "Lagre artikler", "Motta nyhetsbrev", "Grunnleggende profilside"],
    ctaText: "Navaerende plan",
    isPopular: false,
    isActive: true,
    sortOrder: 10,
  },
  {
    planKey: "pluss_monthly",
    displayGroup: "pluss",
    displayName: "TEKKNO Pluss",
    description: "For den bevisste leseren",
    price: 199,
    currency: "NOK",
    interval: "monthly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Tilgang til alle plussaker", "Reklamelett leseopplevelse", "Lagrede artikler", "Eksklusive analyser og guider"],
    ctaText: "Oppgrader til Pluss",
    isPopular: true,
    isActive: true,
    sortOrder: 20,
  },
  {
    planKey: "pluss_yearly",
    displayGroup: "pluss",
    displayName: "TEKKNO Pluss",
    description: "For den bevisste leseren",
    price: 1990,
    currency: "NOK",
    interval: "yearly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Tilgang til alle plussaker", "Reklamelett leseopplevelse", "Lagrede artikler", "Eksklusive analyser og guider"],
    ctaText: "Oppgrader til Pluss",
    isPopular: true,
    isActive: true,
    sortOrder: 21,
  },
  {
    planKey: "premium_monthly",
    displayGroup: "premium",
    displayName: "TEKKNO Premium",
    description: "For ekspertene",
    price: 299,
    currency: "NOK",
    interval: "monthly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Alt i Pluss", "Tidlig tilgang til tester og guider", "Eksklusive premium-artikler", "Dypdykk og longreads", "Prioritert support"],
    ctaText: "Oppgrader til Premium",
    isPopular: false,
    isActive: true,
    sortOrder: 30,
    provider: { vippsProductId: "aivind-premium-monthly", vippsAgreementProductName: "TEKKNO Premium manedlig" },
  },
  {
    planKey: "premium_yearly",
    displayGroup: "premium",
    displayName: "TEKKNO Premium",
    description: "For ekspertene",
    price: 2990,
    currency: "NOK",
    interval: "yearly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Alt i Pluss", "Tidlig tilgang til tester og guider", "Eksklusive premium-artikler", "Dypdykk og longreads", "Prioritert support"],
    ctaText: "Oppgrader til Premium",
    isPopular: false,
    isActive: true,
    sortOrder: 31,
    provider: { vippsProductId: "aivind-premium-yearly", vippsAgreementProductName: "TEKKNO Premium arlig" },
  },
  {
    planKey: "familie_monthly",
    displayGroup: "familie",
    displayName: "TEKKNO Familie",
    description: "For hele husstanden",
    price: 199,
    currency: "NOK",
    interval: "monthly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Alt i Pluss", "Opptil 4 brukere", "Familie-/husstandstilgang", "Administrasjon av familiemedlemmer"],
    ctaText: "Velg Familie",
    isPopular: false,
    isActive: true,
    sortOrder: 40,
  },
  {
    planKey: "familie_yearly",
    displayGroup: "familie",
    displayName: "TEKKNO Familie",
    description: "For hele husstanden",
    price: 1990,
    currency: "NOK",
    interval: "yearly",
    entitlementKey: "premium",
    checkoutMode: "unavailable",
    features: ["Alt i Pluss", "Opptil 4 brukere", "Familie-/husstandstilgang", "Administrasjon av familiemedlemmer"],
    ctaText: "Velg Familie",
    isPopular: false,
    isActive: true,
    sortOrder: 41,
  },
  {
    planKey: "bedrift_monthly",
    displayGroup: "bedrift",
    displayName: "TEKKNO Bedrift",
    description: "For team og bedrifter",
    price: 499,
    currency: "NOK",
    interval: "monthly",
    entitlementKey: "premium",
    checkoutMode: "contact",
    features: ["Tilgang for flere ansatte", "Bedriftsfaktura", "Administrasjon av brukere", "Kontakt salg/redaksjon"],
    ctaText: "Kontakt oss",
    isPopular: false,
    isActive: true,
    sortOrder: 50,
  },
  {
    planKey: "bedrift_yearly",
    displayGroup: "bedrift",
    displayName: "TEKKNO Bedrift",
    description: "For team og bedrifter",
    price: 4990,
    currency: "NOK",
    interval: "yearly",
    entitlementKey: "premium",
    checkoutMode: "contact",
    features: ["Tilgang for flere ansatte", "Bedriftsfaktura", "Administrasjon av brukere", "Kontakt salg/redaksjon"],
    ctaText: "Kontakt oss",
    isPopular: false,
    isActive: true,
    sortOrder: 51,
  },
];

function toPayloadData(plan) {
  return {
    ...plan,
    features: plan.features.map((feature) => ({ feature })),
  };
}

async function main() {
  const payload = await getPayloadClient();
  const result = { created: [], kept: [] };

  for (const plan of seedPlans) {
    const existing = await payload.find({
      collection: "subscription-plans",
      where: { planKey: { equals: plan.planKey } },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.docs?.[0]) {
      result.kept.push(plan.planKey);
      continue;
    }

    await payload.create({
      collection: "subscription-plans",
      data: toPayloadData(plan),
      overrideAccess: true,
    });
    result.created.push(plan.planKey);
  }

  console.log(JSON.stringify(result, null, 2));
  // Payload keeps its local Postgres pool open after a one-off seed completes.
  // Exit explicitly so the command is usable in CI and local setup scripts.
  process.exit(0);
}

main().catch((error) => {
  console.error("[seed-subscription-plans]", error?.message || error);
  process.exitCode = 1;
});
