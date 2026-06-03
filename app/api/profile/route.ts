import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteProfile, getRouteUser } from "@/lib/route-auth";
import { profileSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { signedAvatarUrl } from "@/lib/storage";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  try {
    const profile = await getRouteProfile(supabase);
    return jsonOk({
      profile: {
        ...profile,
        avatar_url: await signedAvatarUrl(supabase, profile.avatar_path)
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    await assertRateLimit(supabase, "update_profile", 20, 60 * 60);

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Profil invalide");

    const { data, error } = await supabase
      .from("users")
      .update({
        username: parsed.data.username,
        display_name: parsed.data.displayName || null,
        bio: parsed.data.bio || null
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) return jsonError("Pseudo deja pris ou profil invalide", 400);
    return jsonOk({ profile: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
