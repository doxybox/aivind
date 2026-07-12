import { GRAPHQL_PLAYGROUND_GET } from "@payloadcms/next/routes";
import config from "@/payloadConfig";

export const GET = GRAPHQL_PLAYGROUND_GET(config);
