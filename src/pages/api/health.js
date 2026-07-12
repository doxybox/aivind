import { sql } from "@/db/client";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store");

  try {
    await sql`select 1 as ok`;
    return res.status(200).json({ status: "ok", database: "reachable" });
  } catch (error) {
    console.error("[health] database check failed", { message: error?.message });
    return res.status(503).json({ status: "degraded", database: "unreachable" });
  }
}
