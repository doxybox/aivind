import { getPayloadFrontpageData } from "@/lib/server/payload-public-data";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await getPayloadFrontpageData();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (error) {
    console.error("[payload/frontpage]", error);
    return res.status(500).json({ error: "Could not load Payload frontpage data" });
  }
}
