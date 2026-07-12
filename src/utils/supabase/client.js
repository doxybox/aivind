import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "./config";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseBrowserConfig();
  return createBrowserClient(supabaseUrl, supabaseKey);
}
