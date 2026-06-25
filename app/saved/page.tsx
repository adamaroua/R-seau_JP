import { AppShell } from "@/components/layout/AppShell";
import { Feed } from "@/components/feed/Feed";
import { requireProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";

export default async function SavedPage() {
  const profile = await requireProfile();
  const shellProfile = await toShellProfile(profile);

  return (
    <AppShell profile={shellProfile} title="Sauvegardes">
      <Feed currentUser={shellProfile} scope="saved" />
    </AppShell>
  );
}
