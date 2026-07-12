import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig = {
  experimental: {
    externalDir: true,
  },
};

export default withPayload(nextConfig);
