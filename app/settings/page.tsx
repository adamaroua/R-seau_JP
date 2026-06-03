import { ProfileSettings } from "@/components/auth/ProfileSettings";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";
import { signedAvatarUrl } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseRpc } from "@/lib/supabase/rpc";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const shellProfile = await toShellProfile(profile);
  const supabase = await createSupabaseServerClient();
  const [{ data: dailyUploadBytes }, { data: savedPostsBytes }] = await Promise.all([
    supabaseRpc<number>(supabase, "daily_uploaded_bytes", { p_user: profile.id }),
    supabaseRpc<number>(supabase, "saved_posts_bytes", { p_user: profile.id })
  ]);

  return (
    <AppShell profile={shellProfile} title="Profil">
      <ProfileSettings
        profile={profile}
        avatarUrl={await signedAvatarUrl(supabase, profile.avatar_path)}
        dailyUploadBytes={dailyUploadBytes ?? 0}
        savedPostsBytes={savedPostsBytes ?? 0}
      />
    </AppShell>
  );
}
