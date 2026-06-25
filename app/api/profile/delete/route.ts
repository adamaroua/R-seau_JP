import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function DELETE() {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "delete_account", 2, 24 * 60 * 60);

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return jsonError(error.message, 400);

    await supabase.auth.signOut();
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
