import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/** Adds an optional editorial image for each Payload category. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "hero_media_id" integer;

    CREATE INDEX IF NOT EXISTS "categories_hero_media_idx"
      ON "categories" USING btree ("hero_media_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_hero_media_idx";
    ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "hero_media_id";
  `);
}
