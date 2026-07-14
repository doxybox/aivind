import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "@/db/auth-schema";
import * as appSchema from "@/db/schema";

const databaseUrl =
  process.env.DATABASE_URI ||
  process.env.DATABASE_URL ||
  process.env.PAYLOAD_DATABASE_URL ||
  "postgres://invalid:invalid@127.0.0.1:1/invalid";
const schema = { ...authSchema, ...appSchema };
const isVercelServerless = process.env.VERCEL === "1";
const configuredPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX || "", 10);
const defaultPoolMax = process.env.NODE_ENV === "production" ? 3 : 1;
const databasePoolMax = isVercelServerless
  ? 1
  : Number.isInteger(configuredPoolMax) && configuredPoolMax > 0
    ? configuredPoolMax
    : defaultPoolMax;

const connectionOptions = {
  max: databasePoolMax,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
};

const globalForDb = globalThis;

if (!globalForDb.aivindPostgresClient) {
  globalForDb.aivindPostgresClient = postgres(databaseUrl, connectionOptions);
}

export const sql = globalForDb.aivindPostgresClient;

export const db = drizzle(sql, { schema });
