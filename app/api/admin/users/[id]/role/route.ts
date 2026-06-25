import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/route-auth";
import { roleSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireAdmin(supabase);
    const { id } = await context.params;
    const parsed = roleSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Role invalide");

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("users")
      .update({ role: parsed.data.role })
      .eq("id", id)
      .select("id,username,role")
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk({ user: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 403);
  }
}
