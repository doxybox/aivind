import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URI or DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const key = `verification:${randomUUID()}`;

try {
  const [schemaState] = await sql`
    select
      to_regclass('public.rate_limit_bucket') is not null as rate_limit_ready,
      to_regclass('public.reels') is not null as reels_ready
  `;
  const [row] = await sql`
    insert into rate_limit_bucket (key, count, reset_at, updated_at)
    values (${key}, 1, ${new Date(Date.now() + 60_000).toISOString()}, now())
    on conflict (key) do update set
      count = case
        when rate_limit_bucket.reset_at <= now() then 1
        else rate_limit_bucket.count + 1
      end,
      reset_at = case
        when rate_limit_bucket.reset_at <= now() then excluded.reset_at
        else rate_limit_bucket.reset_at
      end,
      updated_at = now()
    returning count, reset_at
  `;
  await sql`delete from rate_limit_bucket where key = ${key}`;

  if (Number(row?.count) !== 1) throw new Error("Unexpected verification row");
  if (!schemaState?.rate_limit_ready) throw new Error("rate_limit_bucket is missing");
  console.log(`rate_limit_bucket verification passed; reels table present: ${schemaState.reels_ready === true}`);
} finally {
  await sql.end();
}
