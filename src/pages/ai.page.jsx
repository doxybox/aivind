import AiNewspaperPage from "@/pages/AiNewspaperPage";
import { isPayloadContentSource } from "@/lib/server/content-source";
import { getPayloadCategoryPage } from "@/lib/server/payload-public-data";

export default function AiPage({ payloadCategoryPage = null, payloadMode = false }) {
  return <AiNewspaperPage payloadCategoryPage={payloadCategoryPage} payloadMode={payloadMode} />;
}

export async function getServerSideProps() {
  if (!isPayloadContentSource()) {
    return { props: { payloadMode: false } };
  }

  return {
    props: {
      payloadMode: true,
      payloadCategoryPage: await getPayloadCategoryPage("ai", { allowEmpty: true }),
    },
  };
}
