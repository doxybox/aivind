const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class NewsletterSignupValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "NewsletterSignupValidationError";
    this.status = 400;
  }
}

export function validateNewsletterSignupInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NewsletterSignupValidationError("Ugyldig foresporsel");
  }

  const keys = Object.keys(value);
  if (keys.some((key) => key !== "email")) {
    throw new NewsletterSignupValidationError("Foresporselen inneholder ukjente felt");
  }

  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new NewsletterSignupValidationError("Skriv inn en gyldig e-postadresse");
  }

  return { email };
}
