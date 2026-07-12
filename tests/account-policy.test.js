import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  canReadAccountOverview,
  hasPremiumAccountAccess,
  resolveAccountDataUserId,
  stripForbiddenProfileFields,
} from "../src/lib/server/account-policy.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("unauthenticated user cannot read account overview policy", () => {
  assert.equal(canReadAccountOverview(null), false);
  assert.equal(canReadAccountOverview({ user: null }), false);
});

test("authenticated reader resolves account data to own session user id", () => {
  const session = { user: { id: "reader-1", role: "reader" } };
  assert.equal(canReadAccountOverview(session), true);
  assert.equal(resolveAccountDataUserId(session, "other-user"), "reader-1");
});

test("profile updates strip user-controlled account access fields", () => {
  const clean = stripForbiddenProfileFields({
    userId: "other-user",
    user_id: "other-user",
    role: "admin",
    subscription: { status: "active" },
    entitlements: [{ type: "premium" }],
    first_name: "Robin",
  });

  assert.deepEqual(clean, { first_name: "Robin" });
});

test("expired entitlement does not grant premium account access", () => {
  const now = new Date("2026-06-27T12:00:00Z");
  assert.equal(
    hasPremiumAccountAccess(
      {
        hasActiveSubscription: false,
        entitlements: [
          {
            type: "premium",
            active: true,
            startsAt: new Date("2026-06-01T12:00:00Z"),
            endsAt: new Date("2026-06-20T12:00:00Z"),
          },
        ],
      },
      now,
    ),
    false,
  );
});

test("active entitlement grants premium account access", () => {
  const now = new Date("2026-06-27T12:00:00Z");
  assert.equal(
    hasPremiumAccountAccess(
      {
        hasActiveSubscription: false,
        entitlements: [
          {
            type: "premium",
            active: true,
            startsAt: new Date("2026-06-01T12:00:00Z"),
            endsAt: new Date("2026-07-01T12:00:00Z"),
          },
        ],
      },
      now,
    ),
    true,
  );
});

test("min-side page uses server-side auth before rendering account UI", () => {
  const source = readProjectFile("src/pages/min-side.page.jsx");

  assert.match(source, /getServerSideProps/);
  assert.match(source, /requireAuth\(req\)/);
  assert.match(source, /redirectForAuthError/);
});
