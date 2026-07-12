import { getPayload } from "payload";

let cachedPayloadPromise = null;

export async function getPayloadClient() {
  if (!cachedPayloadPromise) {
    cachedPayloadPromise = import("../../../payload.config.js").then(({ default: config }) => (
      getPayload({ config })
    ));
  }

  return cachedPayloadPromise;
}
