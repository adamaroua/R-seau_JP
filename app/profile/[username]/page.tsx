import { notFound } from "next/navigation";
import { Feed } from "@/components/feed/Feed";
import { AppShell } from "@/components/layout/AppShell";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { requireProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";
import { signedAvatarUrl } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: PageProps) {
  const currentProfile = await requireProfile();
  const shellProfile = await toShellProfile(currentProfile);
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase.from("users").select("*").eq("username", username).single();
  if (!profile) notFound();

  const avatarUrl = await signedAvatarUrl(supabase, profile.avatar_path);

  return (
    <AppShell profile={shellProfile} title={`@${profile.username}`}>
      <div className="mx-auto max-w-6xl px-3 py-5">
        <section className="rounded-md border border-line bg-panel p-5 shadow-glow">
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar username={profile.username} avatarUrl={avatarUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("truncate text-2xl font-black", usernameColor(profile.role))}>
                  @{profile.username}
                </h2>
                <RoleBadge role={profile.role} />
              </div>
              <p className="text-sm text-zinc-400">{profile.display_name ?? "Jean Prevost"}</p>
              {profile.bio && <p className="mt-2 max-w-2xl text-sm text-zinc-300">{profile.bio}</p>}
            </div>
          </div>
        </section>
      </div>
      <Feed currentUser={shellProfile} scope="user" username={profile.username} />
    </AppShell>
  );
}
