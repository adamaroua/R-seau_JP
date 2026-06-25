import type { SupabaseClient } from "@supabase/supabase-js";
import { signedAvatarUrl, signedPostUrl } from "@/lib/storage";
import type { Database, FeedPost, FeedPostRow } from "@/types/database";

export async function hydrateFeedPosts(
  supabase: SupabaseClient<Database>,
  rows: FeedPostRow[] | null
): Promise<FeedPost[]> {
  return Promise.all(
    (rows ?? []).map(async (post) => ({
      ...post,
      image_url: await signedPostUrl(supabase, post.image_path),
      avatar_url: await signedAvatarUrl(supabase, post.avatar_path)
    }))
  );
}
