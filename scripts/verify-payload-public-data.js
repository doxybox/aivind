import {
  getActiveFrontpageSlots,
  getCategories,
  getHomepageContent,
  getPublishedArticles,
} from "../src/lib/server/payload-public-data.js";

async function main() {
  const [articles, categories, frontpageSlots, homepage] = await Promise.all([
    getPublishedArticles({ limit: 10 }),
    getCategories(),
    getActiveFrontpageSlots(),
    getHomepageContent({ limit: 10 }),
  ]);

  console.log(
    JSON.stringify(
      {
        contentSource: process.env.CONTENT_SOURCE || "legacy",
        articles: articles.length,
        categories: categories.length,
        frontpageSlots: frontpageSlots.length,
        homepageArticles: homepage.articles.length,
        reels: homepage.reels.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[verify-payload-public-data]", error?.message || error);
    process.exit(1);
  });
