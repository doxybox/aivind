import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());

const databaseUrl = process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URI || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("PAYLOAD_DATABASE_URL, DATABASE_URI or DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 15 });

try {
  const [counts] = await sql`
    select
      (select count(*)::int from articles where status = 'published' and published_at <= now()) as published_articles,
      (select count(*)::int from articles where status = 'published' and published_at <= now() and access_level = 'public') as public_articles,
      (select count(*)::int from articles where status = 'published' and published_at <= now() and access_level = 'members') as members_articles,
      (select count(*)::int from articles where status = 'published' and published_at <= now() and access_level = 'paid') as paid_articles,
      (select count(*)::int from articles where status = 'draft') as draft_articles,
      (select count(*)::int from articles where scheduled_at > now()) as future_articles,
      (select count(*)::int from articles where title like '[DEMO]%') as demo_articles,
      (select count(*)::int from categories where is_active = true) as active_categories,
      (select count(*)::int from categories where is_active = true and slug = 'ai') as ai_categories,
      (select count(*)::int from authors where is_active = true) as active_authors,
      (select count(*)::int from frontpage_slots where is_active = true) as active_frontpage_slots
  `;

  const productionMinimum = {
    publishedArticles: counts.published_articles >= 3,
    publicArticle: counts.public_articles >= 1,
    membersArticle: counts.members_articles >= 1,
    paidArticle: counts.paid_articles >= 1,
    draftArticle: counts.draft_articles >= 1,
    futureArticle: counts.future_articles >= 1,
    aiCategory: counts.ai_categories >= 1,
    categories: counts.active_categories >= 2,
    author: counts.active_authors >= 1,
    frontpageSlot: counts.active_frontpage_slots >= 1,
    noDemoContent: counts.demo_articles === 0,
  };

  console.log(JSON.stringify({ counts, productionMinimum, ready: Object.values(productionMinimum).every(Boolean) }, null, 2));
  if (process.argv.includes("--strict") && !Object.values(productionMinimum).every(Boolean)) process.exitCode = 1;
} finally {
  await sql.end();
}
