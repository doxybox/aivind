import { toAdsTxtLine } from "@/lib/adsense-normalization";
import { getPublicAdSenseSettings } from "@/lib/server/adsense-settings";

export async function getServerSideProps({ res }) {
  let line = "";

  try {
    const settings = await getPublicAdSenseSettings();
    line = toAdsTxtLine(settings.client);
  } catch (error) {
    console.error("[ads.txt]", { name: error?.name, code: error?.code || null });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.write(line ? `${line}\n` : "");
  res.end();

  return { props: {} };
}

export default function AdsTxt() {
  return null;
}
