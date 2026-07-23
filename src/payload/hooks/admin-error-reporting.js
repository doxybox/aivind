import { randomUUID } from "node:crypto";

function getRequestPath(req) {
  try {
    return new URL(req?.url || "http://localhost").pathname;
  } catch {
    return "unknown";
  }
}

function getSafeErrorMessage(error) {
  return String(error?.message || "Unknown error")
    .replace(/(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s@]+:[^\s@]+@/gi, "[redacted-credentials]@")
    .replace(/(token|secret|password)=([^\s&]+)/gi, "$1=[redacted]")
    .slice(0, 500);
}

// Payload intentionally hides non-public errors from editors. Keep that safety
// boundary, but attach an incident id so Vercel logs can be matched to a report.
export function reportPayloadAdminError({ collection, error, req, result }) {
  const errorId = `payload-${randomUUID().slice(0, 8)}`;
  const status = Number.isInteger(error?.status) ? error.status : 500;

  req?.payload?.logger?.error?.({
    collection: collection?.slug || null,
    errorId,
    errorName: error?.name || "Error",
    errorMessage: getSafeErrorMessage(error),
    method: req?.method || null,
    path: getRequestPath(req),
    status,
    userId: req?.user?.id || null,
  }, "Payload admin request failed");

  // Validation and access errors already carry a safe, actionable Payload
  // response. Only replace unexpected server errors.
  if (status < 500) return;

  return {
    status,
    response: {
      ...(result || {}),
      errors: [
        {
          message: `Kunne ikke fullføre endringen. Prøv igjen. Hvis feilen fortsetter, kontakt redaksjonen med feilkode ${errorId}.`,
          name: "PayloadAdminError",
        },
      ],
      message: `Kunne ikke fullføre endringen. Feilkode: ${errorId}.`,
    },
  };
}
