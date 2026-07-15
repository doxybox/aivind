import assert from "node:assert/strict";
import test from "node:test";
import {
  isEmailDeliveryConfigured,
  isEmailSelfServiceEnabled,
  isEmailSelfServicePath,
} from "../src/lib/auth-launch-mode.js";

test("email self-service is disabled in production without a configured sender", () => {
  assert.equal(isEmailDeliveryConfigured({}), false);
  assert.equal(isEmailSelfServiceEnabled({ NODE_ENV: "production" }), false);
  assert.equal(
    isEmailSelfServiceEnabled({
      NODE_ENV: "production",
      EMAIL_AUTH_ENABLED: "true",
      RESEND_API_KEY: "test-key",
      EMAIL_FROM: "editorial@example.com",
    }),
    true,
  );
});

test("email self-service endpoints are identified before Better Auth handles them", () => {
  assert.equal(isEmailSelfServicePath("/api/auth/sign-up/email"), true);
  assert.equal(isEmailSelfServicePath("/api/auth/request-password-reset"), true);
  assert.equal(isEmailSelfServicePath("/api/auth/sign-in/email"), false);
});
