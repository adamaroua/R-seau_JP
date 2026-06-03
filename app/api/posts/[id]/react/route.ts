import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "react_post", 80, 60 * 60);

    const { id } = await context.params;
    const { kind } = (await request.json()) as { kind?: "like" | "dislike" };
    if (kind !== "like" && kind !== "dislike") return jsonError("Reaction invalide");

    const { data: existing } =
      kind === "like"
        ? await supabase
            .from("likes")
            .select("post_id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : await supabase
            .from("dislikes")
            .select("post_id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

    if (existing) {
      const { error } =
        kind === "like"
          ? await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id)
          : await supabase.from("dislikes").delete().eq("post_id", id).eq("user_id", user.id);
      if (error) return jsonError(error.message, 400);
    } else {
      const { error } =
        kind === "like"
          ? await supabase.from("likes").insert({ post_id: id, user_id: user.id })
          : await supabase.from("dislikes").insert({ post_id: id, user_id: user.id });
      if (error) return jsonError(error.message, 400);
    }

    const [{ count: likeCount }, { count: dislikeCount }] = await Promise.all([
      supabase.from("likes").select("post_id", { count: "exact", head: true }).eq("post_id", id),
      supabase.from("dislikes").select("post_id", { count: "exact", head: true }).eq("post_id", id)
    ]);

    const viewerReaction = existing ? null : kind;
    return jsonOk({
      like_count: likeCount ?? 0,
      dislike_count: dislikeCount ?? 0,
      viewer_reaction: viewerReaction
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
