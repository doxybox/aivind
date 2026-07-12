import "@payloadcms/next/css";
import { handleServerFunctions, metadata, RootLayout } from "@payloadcms/next/layouts";
import config from "@/payloadConfig";
import { importMap } from "./admin/importMap.js";

export { metadata };

async function serverFunction(args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config: args?.config || config,
    importMap: args?.importMap || importMap,
  });
}

export default function Layout({ children }) {
  return (
    <RootLayout
      config={config}
      htmlProps={{ suppressHydrationWarning: true }}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
}
