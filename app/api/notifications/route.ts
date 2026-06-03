import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    const { data, error } = await supabase
      .from("notifications")
      .select("id,kind,title,body,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return jsonError(error.message, 500);
    return jsonOk({ notifications: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}

export async function PATCH() {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) return jsonError(error.message, 400);
    return jsonOk({ read: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
