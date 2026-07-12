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

const connectionOptions = {
  max: Number(process.env.DATABASE_POOL_MAX || (process.env.NODE_ENV === "production" ? 3 : 1)),
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
