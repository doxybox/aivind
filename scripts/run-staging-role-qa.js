import crypto from "node:crypto";
import nextEnv from "@next/env";
import postgres from "postgres";
import { hashPassword } from "better-auth/crypto";

nextEnv.loadEnvConfig(process.cwd());

const baseUrl = (process.env.STAGING_QA_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;
const allowRun = process.env.ALLOW_STAGING_ROLE_QA === "true";
const qaPrefix = `qa-launch-${Date.now()}`;
const password = crypto.randomBytes(24).toString("base64url");
const qaDomain = "qa.tekkno.invalid";

const articleSlugs = {
  public: "slik-bruker-du-ai-mer-bevisst-i-hverdagen",
  members: "fem-vaner-som-gir-bedre-kontroll-pa-nett",
  premium: "en-praktisk-metode-for-a-velge-ai-verktoy-pa-jobb",
  draft: "slik-vurderer-vi-nye-digitale-tjenester",
  future: "nar-teknologien-blir-mindre-synlig",
};

const bodyMarkers = {
  members: "passordtjeneste du stoler på",
  premium: "Til slutt må noen eie vurderingen.",
};

const qaAccounts = [
  { key: "reader", name: "QA Reader", roles: ["reader"] },
  { key: "subscriber", name: "QA Subscriber", roles: ["reader", "subscriber"] },
  { key: "premium", name: "QA Premium", roles: ["reader", "subscriber"], entitlement: "premium" },
  { key: "staff", name: "QA Editor", roles: ["reader", "editor"] },
];

function assertSafeTarget() {
  if (!allowRun) {
    throw new Error("Set ALLOW_STAGING_ROLE_QA=true to run the staging role QA.");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URI or DATABASE_URL is required.");
  }

  if (!baseUrl.startsWith("https://staging.")) {
    throw new Error("STAGING_QA_URL must be the HTTPS staging origin.");
  }
}

function buildEmail(key) {
  return `${qaPrefix}-${key}@${qaDomain}`;
}

function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);

  return values
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function createQaAccounts(sql) {
  const hashedPassword = await hashPassword(password);
  const now = new Date();
  const created = [];

  for (const account of qaAccounts) {
    const id = crypto.randomUUID();
    const email = buildEmail(account.key);
    const accountId = crypto.randomUUID();

    await sql.begin(async (transaction) => {
      await transaction`
        insert into "user" (id, name, email, email_verified, created_at, updated_at)
        values (${id}, ${account.name}, ${email}, true, ${now}, ${now})
      `;

      await transaction`
        insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
        values (${accountId}, ${id}, 'credential', ${id}, ${hashedPassword}, ${now}, ${now})
      `;

      await transaction`
        insert into user_profile (user_id, display_name, email, email_verified)
        values (${id}, ${account.name}, ${email}, true)
      `;

      for (const role of account.roles) {
        await transaction`
          insert into user_role (user_id, role)
          values (${id}, ${role})
          on conflict (user_id, role) do nothing
        `;
      }

      if (account.entitlement) {
        const endsAt = new Date(now.getTime() + 60 * 60 * 1000);
        await transaction`
          insert into entitlement (user_id, type, active, source, starts_at, ends_at, created_at, updated_at)
          values (${id}, ${account.entitlement}, true, 'staging_qa', ${now}, ${endsAt}, ${now}, ${now})
        `;
      }
    });

    created.push({ ...account, id, email });
  }

  return created;
}

async function cleanupQaAccounts(sql) {
  const users = await sql`
    select id from "user"
    where email like ${`${qaPrefix}-%@${qaDomain}`}
  `;
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return 0;

  await sql.begin(async (transaction) => {
    await transaction`delete from entitlement where user_id = any(${userIds})`;
    await transaction`delete from subscription where user_id = any(${userIds})`;
    await transaction`delete from saved_article where user_id = any(${userIds})`;
    await transaction`delete from newsletter_preference where user_id = any(${userIds})`;
    await transaction`delete from user_role where user_id = any(${userIds})`;
    await transaction`delete from user_profile where user_id = any(${userIds})`;
    await transaction`delete from session where user_id = any(${userIds})`;
    await transaction`delete from account where user_id = any(${userIds})`;
    await transaction`delete from "user" where id = any(${userIds})`;
  });

  return userIds.length;
}

async function signIn(email) {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({ email, password, rememberMe: false }),
    redirect: "manual",
  });

  if (!response.ok) {
    throw new Error(`Sign-in failed for staging QA (${response.status}).`);
  }

  const cookie = cookieHeader(response);
  if (!cookie) throw new Error("Sign-in did not issue a session cookie.");
  return cookie;
}

async function request(path, { cookie = "", redirect = "manual" } = {}) {
  return fetch(`${baseUrl}${path}`, {
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: baseUrl,
    },
    redirect,
  });
}

async function assertStatus(label, response, expected) {
  if (response.status !== expected) {
    throw new Error(`${label} returned ${response.status}; expected ${expected}.`);
  }
}

async function assertPageContains(label, response, marker) {
  const html = await response.text();
  if (!html.includes(marker)) throw new Error(`${label} did not render the expected content marker.`);
}

async function assertPageDoesNotContain(label, response, marker) {
  const html = await response.text();
  if (html.includes(marker)) throw new Error(`${label} leaked restricted article body content.`);
}

async function getFuturePublishState() {
  const response = await request(`/artikler/${articleSlugs.future}`);

  if (response.status === 404) return "hidden_before_publish";
  if (response.status === 200) return "visible_after_publish";

  throw new Error(`Future article returned ${response.status}; expected 404 before publish or 200 after publish.`);
}

async function runChecks(accounts) {
  const byKey = new Map(accounts.map((account) => [account.key, account]));
  const readerCookie = await signIn(byKey.get("reader").email);
  const subscriberCookie = await signIn(byKey.get("subscriber").email);
  const premiumCookie = await signIn(byKey.get("premium").email);
  const staffCookie = await signIn(byKey.get("staff").email);

  await assertStatus("Public article", await request(`/artikler/${articleSlugs.public}`), 200);
  await assertStatus("Draft article", await request(`/artikler/${articleSlugs.draft}`), 404);
  const futurePublishState = await getFuturePublishState();

  await assertPageDoesNotContain(
    "Unauthenticated members article",
    await request(`/artikler/${articleSlugs.members}`),
    bodyMarkers.members,
  );
  await assertPageDoesNotContain(
    "Unauthenticated premium article",
    await request(`/artikler/${articleSlugs.premium}`),
    bodyMarkers.premium,
  );

  await assertPageContains(
    "Reader members article",
    await request(`/artikler/${articleSlugs.members}`, { cookie: readerCookie }),
    bodyMarkers.members,
  );
  await assertPageDoesNotContain(
    "Reader premium article",
    await request(`/artikler/${articleSlugs.premium}`, { cookie: readerCookie }),
    bodyMarkers.premium,
  );
  await assertPageContains(
    "Subscriber members article",
    await request(`/artikler/${articleSlugs.members}`, { cookie: subscriberCookie }),
    bodyMarkers.members,
  );
  await assertPageContains(
    "Premium entitlement article",
    await request(`/artikler/${articleSlugs.premium}`, { cookie: premiumCookie }),
    bodyMarkers.premium,
  );
  await assertPageContains(
    "Staff premium override",
    await request(`/artikler/${articleSlugs.premium}`, { cookie: staffCookie }),
    bodyMarkers.premium,
  );

  for (const [label, path] of [
    ["Reader account overview", "/api/account/overview"],
    ["Reader saved articles", "/api/account/saved-articles"],
    ["Reader newsletter preferences", "/api/account/newsletter-preferences"],
    ["Reader min-side", "/min-side"],
  ]) {
    await assertStatus(label, await request(path, { cookie: readerCookie }), 200);
  }

  await assertStatus("Reader staff media denial", await request("/redaksjon/media", { cookie: readerCookie }), 307);
  await assertStatus("Staff media access", await request("/redaksjon/media", { cookie: staffCookie }), 200);

  return {
    publicArticle: "pass",
    draftHidden: "pass",
    futurePublish: futurePublishState,
    membersAccess: "pass",
    premiumPaywall: "pass",
    premiumEntitlement: "pass",
    staffOverride: "pass",
    accountApis: "pass",
    staffMediaAccess: "pass",
  };
}

async function main() {
  assertSafeTarget();
  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 15 });
  let result;

  try {
    const accounts = await createQaAccounts(sql);
    result = await runChecks(accounts);
  } finally {
    const removed = await cleanupQaAccounts(sql);
    await sql.end();
    if (removed !== qaAccounts.length) {
      throw new Error(`QA cleanup removed ${removed} accounts; expected ${qaAccounts.length}.`);
    }
  }

  console.log(JSON.stringify({ ok: true, target: baseUrl, checks: result, qaAccountsRemoved: qaAccounts.length }, null, 2));
}

main().catch((error) => {
  console.error("[staging-role-qa]", error?.message || error);
  process.exit(1);
});
