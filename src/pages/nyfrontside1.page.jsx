export { default } from "@/pages/NyFrontside1";

import { isPayloadContentSource } from "@/lib/server/content-source";
import { getHomepageContent } from "@/lib/server/payload-public-data";

export async function getServerSideProps() {
  if (!isPayloadContentSource()) {
    return { props: {} };
  }

  const payloadHomepageContent = await getHomepageContent();

  return {
    props: {
      payloadHomepageContent:
        payloadHomepageContent.articles.length > 0 || payloadHomepageContent.reels.length > 0
          ? payloadHomepageContent
          : null,
    },
  };
}
