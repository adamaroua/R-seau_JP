import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const POST_MEDIA_BUCKET = "post-media";
export const AVATAR_BUCKET = "avatars";
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const DAILY_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SAVED_POSTS_BYTES = 25 * 1024 * 1024;

export async function signedPostUrl(
  supabase: SupabaseClient<Database>,
  path: string | null
) {
  if (!path) return null;
  const { data } = await supabase.storage.from(POST_MEDIA_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function signedAvatarUrl(
  supabase: SupabaseClient<Database>,
  path: string | null
) {
  if (!path) return null;
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function removePostMedia(supabase: SupabaseClient<Database>, path: string | null) {
  if (!path) return;
  await supabase.storage.from(POST_MEDIA_BUCKET).remove([path]);
}
