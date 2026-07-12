import CategoryPage from "@/components/aivind/CategoryPage";
import { isPayloadContentSource } from "@/lib/server/content-source";
import { getPayloadCategoryPage } from "@/lib/server/payload-public-data";

export default function GadgetsPage({ payloadCategoryPage = null }) {
  return <CategoryPage slug="gadgets" payloadCategoryPage={payloadCategoryPage} />;
}

export async function getServerSideProps() {
  if (!isPayloadContentSource()) {
    return { props: {} };
  }

  return {
    props: {
      payloadCategoryPage: await getPayloadCategoryPage("gadgets"),
    },
  };
}
