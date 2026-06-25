import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { commentSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { signedAvatarUrl } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    await getRouteUser(supabase);
    const { id } = await context.params;

    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message, 500);

    const authorIds = Array.from(new Set((comments ?? []).map((comment) => comment.author_id)));
    const { data: authors } = authorIds.length
      ? await supabase.from("users").select("*").in("id", authorIds)
      : { data: [] };

    const authorById = new Map((authors ?? []).map((author) => [author.id, author]));
    const hydrated = await Promise.all(
      (comments ?? []).map(async (comment) => {
        const author = authorById.get(comment.author_id);
        return {
          id: comment.id,
          body: comment.body,
          created_at: comment.created_at,
          author: {
            id: author?.id ?? comment.author_id,
            username: author?.username ?? "inconnu",
            display_name: author?.display_name ?? null,
            avatar_url: await signedAvatarUrl(supabase, author?.avatar_path ?? null),
            role: author?.role ?? "user"
          }
        };
      })
    );

    return jsonOk({ comments: hydrated });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "comment_post", 20, 60 * 60);

    const { id } = await context.params;
    const parsed = commentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Commentaire invalide");

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        author_id: user.id,
        body: parsed.data.body
      })
      .select("id")
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk({ id: data.id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
