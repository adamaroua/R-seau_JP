import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";
import { removePostMedia } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    await getRouteUser(supabase);
    const { id } = await context.params;

    const { data: post, error: readError } = await supabase
      .from("posts")
      .select("id,image_path")
      .eq("id", id)
      .single();

    if (readError || !post) return jsonError("Post introuvable", 404);

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return jsonError(error.message, 403);

    await removePostMedia(supabase, post.image_path);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
