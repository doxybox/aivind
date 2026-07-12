const REEL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_REEL_SLUGS = 12;

export function validateReelSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  if (!slug || slug.length > 160 || !REEL_SLUG_PATTERN.test(slug)) {
    const error = new Error("Ugyldig reel");
    error.status = 400;
    throw error;
  }
  return slug;
}

export function validateReelSlugs(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  const slugs = [...new Set(values.filter(Boolean).map(validateReelSlug))];
  if (slugs.length === 0 || slugs.length > MAX_REEL_SLUGS) {
    const error = new Error("Ugyldig antall reels");
    error.status = 400;
    throw error;
  }
  return slugs;
}

export function validateReelViewInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("Ugyldig foresporsel");
    error.status = 400;
    throw error;
  }
  if (Object.keys(input).some((key) => key !== "slug")) {
    const error = new Error("Ugyldige felter");
    error.status = 400;
    throw error;
  }
  return { slug: validateReelSlug(input.slug) };
}

export function formatReelDuration(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 36000) return "";

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
