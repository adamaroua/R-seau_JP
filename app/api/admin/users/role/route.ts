import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/route-auth";
import { roleSchema, usernameSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  username: usernameSchema,
  role: roleSchema.shape.role
});

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireAdmin(supabase);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Demande invalide");

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("users")
      .update({ role: parsed.data.role })
      .eq("username", parsed.data.username)
      .select("id,username,role")
      .single();

    if (error) return jsonError("Utilisateur introuvable", 404);
    return jsonOk({ user: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 403);
  }
}
