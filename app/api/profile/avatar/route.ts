import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseRpc } from "@/lib/supabase/rpc";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRouteProfile, getRouteUser } from "@/lib/route-auth";
import { allowedAvatarTypes, hasValidImageSignature, imageExtension } from "@/lib/validation";
import { AVATAR_BUCKET, MAX_AVATAR_BYTES, signedAvatarUrl } from "@/lib/storage";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const user = await getRouteUser(supabase);
    const profile = await getRouteProfile(supabase, user);
    await assertRateLimit(supabase, "update_avatar", 8, 60 * 60);

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size <= 0) return jsonError("Image requise");
    if (!allowedAvatarTypes.has(file.type)) return jsonError("Format avatar refuse");
    if (!(await hasValidImageSignature(file))) return jsonError("Fichier image invalide");
    if (file.size > MAX_AVATAR_BYTES) return jsonError("Avatar trop lourd (2 Mo max)");

    const { data: quotaOk } = await supabaseRpc<boolean>(supabase, "can_upload_bytes", {
      p_user: user.id,
      p_bytes: file.size
    });
    if (!quotaOk) return jsonError("Limite de 10 Mo uploades aujourd'hui atteinte", 429);

    const ext = imageExtension(file.type);
    if (!ext) return jsonError("Format avatar refuse");

    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) return jsonError(uploadError.message, 400);

    const { error: eventError } = await supabaseRpc<undefined>(supabase, "register_upload_event", {
      p_bytes: file.size,
      p_kind: "avatar"
    });
    if (eventError) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      return jsonError(eventError.message, 400);
    }

    const { error } = await supabase.from("users").update({ avatar_path: path }).eq("id", user.id);
    if (error) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      return jsonError(error.message, 400);
    }

    if (profile.avatar_path) {
      await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_path]);
    }

    return jsonOk({ avatar_url: await signedAvatarUrl(supabase, path), avatar_path: path });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Erreur serveur", 401);
  }
}
