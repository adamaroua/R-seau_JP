import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, SessionProfile } from "@/types/database";

export async function getRouteUser(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Connexion requise");
  }

  return user;
}

export async function getRouteProfile(
  supabase: SupabaseClient<Database>,
  user?: User
): Promise<SessionProfile> {
  const currentUser = user ?? (await getRouteUser(supabase));
  const { data, error } = await supabase.from("users").select("*").eq("id", currentUser.id).single();

  if (error || !data) {
    throw new Error("Profil introuvable");
  }

  return data;
}

export async function requireAdmin(supabase: SupabaseClient<Database>) {
  const profile = await getRouteProfile(supabase);
  if (profile.role !== "admin") {
    throw new Error("Acces admin requis");
  }
  return profile;
}

export async function requireStaff(supabase: SupabaseClient<Database>) {
  const profile = await getRouteProfile(supabase);
  if (profile.role !== "admin" && profile.role !== "moderator") {
    throw new Error("Acces moderation requis");
  }
  return profile;
}
