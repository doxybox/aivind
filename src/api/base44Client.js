import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { fallbackMarketData } from '@/lib/market-data-fallback';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const hasBase44AppId = Boolean(appId && appId !== "null" && appId !== "undefined");

const createBase44FallbackClient = () => ({
  functions: {
    async invoke(name) {
      if (name === "getMarketData") {
        return { data: fallbackMarketData };
      }

      return {
        data: {
          success: false,
          error: "Base44 is not configured for this environment.",
        },
      };
    },
  },
  entities: new Proxy(
    {},
    {
      get() {
        return {
          async filter() {
            return [];
          },
          async create() {
            throw new Error("Base44 is not configured for this environment.");
          },
          async update() {
            throw new Error("Base44 is not configured for this environment.");
          },
          async delete() {
            throw new Error("Base44 is not configured for this environment.");
          },
        };
      },
    },
  ),
  integrations: {
    Core: {
      async UploadFile() {
        throw new Error("Base44 is not configured for this environment.");
      },
    },
  },
});

// Avoid initializing the Base44 SDK without an app id. The SDK otherwise tries
// /api/apps/null/... endpoints, which is noisy and no longer part of auth/data.
export const base44 = hasBase44AppId
  ? createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl
    })
  : createBase44FallbackClient();
