import { getPublicAdSenseSettings } from "@/lib/server/adsense-settings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getPublicAdSenseSettings();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(settings);
  } catch (error) {
    console.error("[adsense/config]", { name: error?.name, code: error?.code || null });
    return res.status(200).json({ enabled: false, client: "", slots: {} });
  }
}
