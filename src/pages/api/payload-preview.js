import { verifyPayloadPreviewToken } from "@/lib/server/payload-preview";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!verifyPayloadPreviewToken(slug, token)) {
    return res.status(401).json({ error: "Preview link is invalid or expired" });
  }

  const cookieParts = [
    `payload_editorial_preview=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/artikler",
    "SameSite=Lax",
    "Max-Age=600",
  ];
  if (process.env.NODE_ENV === "production") cookieParts.push("Secure");

  res.setHeader("Set-Cookie", cookieParts.join("; "));
  return res.redirect(307, `/artikler/${encodeURIComponent(slug)}`);
}
