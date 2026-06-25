import { AppShell } from "@/components/layout/AppShell";
import { Feed } from "@/components/feed/Feed";
import { requireProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";

export default async function FeedPage() {
  const profile = await requireProfile();
  const shellProfile = await toShellProfile(profile);

  return (
    <AppShell profile={shellProfile} title="Feed">
      <Feed currentUser={shellProfile} />
    </AppShell>
  );
}
