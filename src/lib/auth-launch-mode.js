const emailSelfServicePaths = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/request-password-reset",
  "/api/auth/send-verification-email",
  "/api/auth/reset-password",
]);

export function isEmailDeliveryConfigured(env = process.env) {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export function isEmailSelfServiceEnabled(env = process.env) {
  if (env.NODE_ENV !== "production") return true;

  return env.EMAIL_AUTH_ENABLED === "true" && isEmailDeliveryConfigured(env);
}

export function isClientEmailSelfServiceEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED === "true";
}

export function isEmailSelfServicePath(url = "") {
  const pathname = new URL(url, "http://localhost").pathname;
  return emailSelfServicePaths.has(pathname);
}
