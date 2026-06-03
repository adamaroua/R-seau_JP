import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type RpcResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type RpcCaller = <T>(
  fn: string,
  args?: Record<string, unknown>
) => Promise<RpcResult<T>>;

export function supabaseRpc<T>(
  client: SupabaseClient<Database>,
  fn: string,
  args?: Record<string, unknown>
) {
  const call = client.rpc.bind(client) as unknown as RpcCaller;
  return call<T>(fn, args);
}
