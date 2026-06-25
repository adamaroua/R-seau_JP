import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteUser } from "@/lib/route-auth";
import { jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8).max(128)
});

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    await getRouteUser(supabase);
    await assertRateLimit(supabase, "update_password", 5, 60 * 60);

    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Mot de passe invalide");

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return jsonError(error.message, 400);

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
