import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

export function createAdminClient() {
  const env = getSupabaseEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
