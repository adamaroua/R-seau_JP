import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
