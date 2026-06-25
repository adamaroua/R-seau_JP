import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseRpc } from "@/lib/supabase/rpc";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";
import { SAVED_POSTS_BYTES } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "save_post", 60, 60 * 60);

    const { id } = await context.params;
    const { data: existing } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", id)
        .eq("user_id", user.id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ saved: false });
    }

    const [{ data: post }, { data: savedBytes }] = await Promise.all([
      supabase.from("posts").select("image_bytes").eq("id", id).single(),
      supabaseRpc<number>(supabase, "saved_posts_bytes", { p_user: user.id })
    ]);

    if (!post) return jsonError("Post introuvable", 404);
    if ((savedBytes ?? 0) + (post.image_bytes ?? 0) > SAVED_POSTS_BYTES) {
      return jsonError("Limite de 25 Mo de posts sauvegardes atteinte", 429);
    }

    const { error } = await supabase.from("saved_posts").insert({ post_id: id, user_id: user.id });
    if (error) return jsonError(error.message, 400);
    return jsonOk({ saved: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
