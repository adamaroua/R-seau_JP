import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseRpc } from "@/lib/supabase/rpc";
import { getCronSecret } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = getCronSecret();

  if (auth !== `Bearer ${expected}` && secret !== expected) {
    return jsonError("Non autorise", 401);
  }

  const admin = createSupabaseAdminClient();
  const { data: mediaPaths } = await supabaseRpc<Array<{ id: string; bucket: string; path: string }>>(
    admin,
    "expired_post_media_paths"
  );

  const pathsByBucket = new Map<string, string[]>();
  for (const item of mediaPaths ?? []) {
    if (!item.path) continue;
    const paths = pathsByBucket.get(item.bucket) ?? [];
    paths.push(item.path);
    pathsByBucket.set(item.bucket, paths);
  }

  for (const [bucket, paths] of pathsByBucket.entries()) {
    await admin.storage.from(bucket).remove(paths);
  }

  const { data, error } = await supabaseRpc<number>(admin, "cleanup_expired_posts");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ removed: data ?? 0 });
}
