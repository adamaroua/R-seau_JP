import { signedAvatarUrl } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ShellProfile } from "@/components/layout/AppShell";
import type { SessionProfile } from "@/types/database";

export async function toShellProfile(profile: SessionProfile): Promise<ShellProfile> {
  const supabase = await createSupabaseServerClient();
  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    role: profile.role,
    avatar_url: await signedAvatarUrl(supabase, profile.avatar_path)
  };
}
