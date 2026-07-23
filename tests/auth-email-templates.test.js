import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordResetEmail,
  createVerificationEmail,
} from "../src/lib/email-templates.js";

const actionUrl = "https://staging.tekkno.no/api/auth/verify-email?token=abc&callbackURL=%2Fmin-side";

test("verification email contains a branded CTA and a plain text fallback", () => {
  const email = createVerificationEmail({ user: { name: "Kari" }, url: actionUrl });

  assert.equal(email.subject, "Bekreft e-posten din hos TEKKNO");
  assert.match(email.html, /TEKKNO/);
  assert.match(email.html, /Bekreft e-postadresse/);
  assert.match(email.html, /token=abc&amp;callbackURL/);
  assert.match(email.text, /Hei Kari/);
  assert.match(email.text, new RegExp(actionUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("password reset email escapes user-controlled content", () => {
  const email = createPasswordResetEmail({ user: { name: "<Kari & Ola>" }, url: actionUrl });

  assert.equal(email.subject, "Tilbakestill passordet ditt hos TEKKNO");
  assert.match(email.html, /Velg nytt passord/);
  assert.match(email.html, /Hei &lt;Kari &amp; Ola&gt;/);
  assert.doesNotMatch(email.html, /Hei <Kari & Ola>/);
});
