import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/route-auth";
import { removePostMedia } from "@/lib/storage";
import { jsonError, jsonOk } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireAdmin(supabase);
    const { id } = await context.params;
    const admin = createSupabaseAdminClient();

    const { data } = await admin.from("posts").select("image_path").eq("id", id).single();
    const post = data as { image_path: string | null } | null;
    const { error } = await admin.from("posts").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);

    await removePostMedia(admin, post?.image_path ?? null);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 403);
  }
}
