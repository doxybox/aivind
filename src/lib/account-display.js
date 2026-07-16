export function isActivePaidSubscription(subscription) {
  return Boolean(
    subscription &&
      subscription.plan_type &&
      subscription.plan_type !== "free" &&
      ["active", "trialing"].includes(subscription.status),
  );
}

export function getAccountPlanLabel({ subscription, premiumAccess, loadFailed } = {}) {
  if (loadFailed) return "Kunne ikke hente abonnement";
  if (isActivePaidSubscription(subscription)) {
    return subscription?.plan_name || subscription?.plan_type || "Abonnement";
  }
  if (premiumAccess) return "Premium tilgang";
  return "Gratis";
}

export function getAccountStatusLabel({ subscription, premiumAccess, loadFailed } = {}) {
  if (loadFailed) return "Ukjent status";
  return getAccountPlanLabel({ subscription, premiumAccess }) === "Gratis" ? "Gratis bruker" : "Abonnent";
}

export function getDisplayName(user, profile) {
  return profile?.display_name || user?.display_name || user?.full_name || user?.name || user?.email || "Bruker";
}

export function getAvatarInitial(user, profile) {
  return (getDisplayName(user, profile).trim()[0] || "?").toUpperCase();
}

export function formatAccountDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
