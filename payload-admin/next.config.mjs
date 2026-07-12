import { withPayload } from "@payloadcms/next/withPayload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const adminRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: path.resolve(adminRoot, ".."),
  },
  experimental: {
    externalDir: true,
  },
};

export default withPayload(nextConfig);
