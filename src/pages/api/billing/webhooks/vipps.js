import {
  findSubscriptionByProviderId,
  recordBillingEvent,
} from "@/lib/server/billing/billing-service";
import {
  extractVippsWebhookEvent,
  fetchVippsRecurringAgreement,
  validateVippsWebhookRequest,
  VippsRecurringNotConfiguredError,
} from "@/lib/server/billing/providers/vipps-recurring";
import { syncVippsAgreementStatusToSubscription } from "@/lib/server/billing/vipps-status-sync";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendError(res, error) {
  const status = error instanceof VippsRecurringNotConfiguredError ? error.status : error?.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
    ...(error instanceof VippsRecurringNotConfiguredError ? { missing: error.missing || [] } : {}),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);
    const body = validateVippsWebhookRequest(req, rawBody);
    const event = extractVippsWebhookEvent(body, rawBody);

    if (!event.agreementId) {
      return res.status(202).json({
        processed: false,
        reason: "missing_agreement_id",
      });
    }

    const billingEvent = await recordBillingEvent({
      provider: "vipps",
      eventId: event.eventId,
      providerSubscriptionId: event.agreementId,
      eventType: event.eventType,
      status: event.status,
      payloadHash: event.payloadHash,
    });

    if (!billingEvent.inserted) {
      return res.status(200).json({
        processed: false,
        duplicate: true,
      });
    }

    const subscription = await findSubscriptionByProviderId("vipps", event.agreementId);
    if (!subscription) {
      return res.status(202).json({
        processed: false,
        reason: "subscription_not_found",
      });
    }

    const agreementStatus = await fetchVippsRecurringAgreement(event.agreementId);
    const syncedSubscription = await syncVippsAgreementStatusToSubscription(subscription, agreementStatus);

    return res.status(202).json({
      processed: true,
      status: syncedSubscription?.status || subscription.status,
      vippsStatus: agreementStatus.vippsStatus,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
