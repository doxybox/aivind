import {
  buildSubscriptionPlanCards,
  getActiveSubscriptionPlans,
} from "@/lib/server/billing/subscription-plan-catalog";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const plans = await getActiveSubscriptionPlans();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ plans: buildSubscriptionPlanCards(plans) });
  } catch (error) {
    console.error("[billing:plans]", { message: error?.message || "Failed to load subscription plans" });
    return res.status(503).json({ error: "Abonnementsplaner er ikke tilgjengelige akkurat na." });
  }
}
