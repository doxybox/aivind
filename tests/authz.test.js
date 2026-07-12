import assert from "node:assert/strict";
import test from "node:test";
import { hasActiveEntitlement, hasAnyRole, hasRole, isSubscriptionActive } from "../src/lib/server/authz-core.js";

test("unauthenticated user has no protected roles", () => {
  assert.equal(hasRole([], "admin"), false);
  assert.equal(hasAnyRole([], ["subscriber", "admin"]), false);
});

test("reader cannot access subscriber-only role checks", () => {
  assert.equal(hasAnyRole(["reader"], ["subscriber", "admin"]), false);
});

test("subscriber can pass subscriber role checks", () => {
  assert.equal(hasAnyRole(["reader", "subscriber"], ["subscriber", "admin"]), true);
});

test("non-admin cannot access admin role checks", () => {
  assert.equal(hasRole(["reader", "editor"], "admin"), false);
});

test("admin can pass admin role checks", () => {
  assert.equal(hasRole(["reader", "admin"], "admin"), true);
});

test("expired entitlement does not grant access", () => {
  const now = new Date("2026-06-27T12:00:00Z");
  assert.equal(
    hasActiveEntitlement(
      [
        {
          type: "premium",
          active: true,
          startsAt: new Date("2026-06-01T12:00:00Z"),
          endsAt: new Date("2026-06-20T12:00:00Z"),
        },
      ],
      "premium",
      now,
    ),
    false,
  );
});

test("active entitlement grants access", () => {
  const now = new Date("2026-06-27T12:00:00Z");
  assert.equal(
    hasActiveEntitlement(
      [
        {
          type: "premium",
          active: true,
          startsAt: new Date("2026-06-01T12:00:00Z"),
          endsAt: new Date("2026-07-01T12:00:00Z"),
        },
      ],
      "premium",
      now,
    ),
    true,
  );
});

test("active subscription requires active status and valid period", () => {
  const now = new Date("2026-06-27T12:00:00Z");

  assert.equal(
    isSubscriptionActive(
      {
        status: "active",
        currentPeriodStart: new Date("2026-06-01T12:00:00Z"),
        currentPeriodEnd: new Date("2026-07-01T12:00:00Z"),
      },
      now,
    ),
    true,
  );

  assert.equal(
    isSubscriptionActive(
      {
        status: "active",
        currentPeriodStart: new Date("2026-06-01T12:00:00Z"),
        currentPeriodEnd: new Date("2026-06-02T12:00:00Z"),
      },
      now,
    ),
    false,
  );
});
