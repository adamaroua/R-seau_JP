import { createHash } from "crypto";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseRpc } from "@/lib/supabase/rpc";
import type { Database } from "@/types/database";

export async function hashRequestIp() {
  const headerStore = await headers();
  const raw =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "local";

  return createHash("sha256").update(raw).digest("hex");
}

export async function assertRateLimit(
  supabase: SupabaseClient<Database>,
  action: string,
  limit: number,
  windowSeconds: number
) {
  const ipHash = await hashRequestIp();
  const { data, error } = await supabaseRpc<boolean>(supabase, "check_rate_limit", {
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_ip_hash: ipHash
  });

  if (error || data !== true) {
    throw new Error("Trop d'actions en peu de temps");
  }
}
