import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import sharp from "sharp";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { createHash } from "crypto";
import { collections } from "./src/payload/collections/index.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function loadEnvFile(fileName) {
  const filePath = path.resolve(dirname, fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URI || process.env.DATABASE_URL;
const payloadSecret = process.env.PAYLOAD_SECRET;
const expectedDatabaseFingerprint = process.env.PAYLOAD_DATABASE_FINGERPRINT_EXPECTED;
const isVercelServerless = process.env.VERCEL === "1";
const defaultPayloadPoolMax = process.env.NODE_ENV === "production" ? 1 : 3;
const configuredPoolMax = Number.parseInt(
  process.env.PAYLOAD_DATABASE_POOL_MAX || process.env.DATABASE_POOL_MAX || String(defaultPayloadPoolMax),
  10,
);
const hasConfiguredPoolMax = Number.isInteger(configuredPoolMax) && configuredPoolMax > 0;
// Payload Admin can make nested SSR queries. One pooled connection deadlocks those
// requests on Vercel, while more than two connections exhausts the Supabase pool.
const payloadPoolMax = isVercelServerless
  ? Math.min(hasConfiguredPoolMax ? configuredPoolMax : 2, 2)
  : hasConfiguredPoolMax
    ? configuredPoolMax
    : defaultPayloadPoolMax;

if (!payloadDatabaseUrl) {
  throw new Error("Missing DATABASE_URI, PAYLOAD_DATABASE_URL, or DATABASE_URL for Payload.");
}

if (!payloadSecret) {
  throw new Error("Missing PAYLOAD_SECRET for Payload.");
}

if (expectedDatabaseFingerprint) {
  const actualDatabaseFingerprint = createHash("sha256")
    .update(payloadDatabaseUrl)
    .digest("hex");

  if (actualDatabaseFingerprint !== expectedDatabaseFingerprint) {
    throw new Error("Payload database configuration does not match the expected staging database.");
  }
}

export default buildConfig({
  admin: {
    user: "payload-users",
    importMap: {
      autoGenerate: false,
      baseDir: dirname,
      importMapFile: path.resolve(dirname, "payload-admin/src/app/(payload)/admin/importMap.js"),
    },
  },
  collections,
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
      max: payloadPoolMax,
      // Serverless instances must not keep pooled Supabase sessions alive between requests.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: isVercelServerless ? 5_000 : 30_000,
      allowExitOnIdle: isVercelServerless,
    },
    push: false,
  }),
  secret: payloadSecret,
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
});
