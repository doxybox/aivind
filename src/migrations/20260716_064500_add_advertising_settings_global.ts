import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/** Adds the Payload Global used to configure public Google AdSense placements. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "advertising_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "adsense_enabled" boolean DEFAULT false,
      "adsense_client" varchar,
      "slots_home_primary" varchar,
      "slots_home_secondary" varchar,
      "slots_category_bottom" varchar,
      "slots_article_sidebar_top" varchar,
      "slots_article_sidebar_bottom" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "advertising_settings";
  `);
}
