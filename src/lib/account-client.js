async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || "Kunne ikke hente kontodata");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getAccountOverview() {
  return requestJson("/api/account/overview");
}

export function getProfile() {
  return requestJson("/api/account/profile");
}

export function updateProfile(input) {
  return requestJson("/api/account/profile", {
    method: "PUT",
    body: JSON.stringify(input || {}),
  });
}

export function getSubscription() {
  return requestJson("/api/account/subscription");
}

export function getNewsletterPreferences() {
  return requestJson("/api/account/newsletter-preferences");
}

export function updateNewsletterPreferences(input) {
  return requestJson("/api/account/newsletter-preferences", {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
}

export function getPaymentHistory() {
  return requestJson("/api/account/payment-history");
}

export function getSavedArticles() {
  return requestJson("/api/account/saved-articles");
}

export function saveArticle(input) {
  return requestJson("/api/account/saved-articles", {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
}

export function deleteSavedArticle(identifier) {
  const id = typeof identifier === "object" ? identifier?.id : identifier;
  const slug = typeof identifier === "object" ? identifier?.slug || identifier?.articleSlug : "";
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  if (slug) params.set("slug", slug);

  return requestJson(`/api/account/saved-articles?${params.toString()}`, {
    method: "DELETE",
  });
}
