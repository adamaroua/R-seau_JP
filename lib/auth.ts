import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionProfile } from "@/types/database";

export async function getCurrentProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return data ?? null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  return profile;
}

export async function requireStaffProfile() {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "moderator") redirect("/feed");
  return profile;
}
