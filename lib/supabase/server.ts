import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

export function createAnonClient() {
  const env = getSupabaseEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
