import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/** Adds Payload's native draft-autosave marker to existing article versions. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_articles_v"
      ADD COLUMN IF NOT EXISTS "autosave" boolean DEFAULT false;

    CREATE INDEX IF NOT EXISTS "_articles_v_autosave_idx"
      ON "_articles_v" USING btree ("autosave");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Historical draft versions are retained intentionally.
}
