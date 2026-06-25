import { ChatShell } from "@/components/chat/ChatShell";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";

export default async function ChatPage() {
  const profile = await requireProfile();
  const shellProfile = await toShellProfile(profile);

  return (
    <AppShell profile={shellProfile} title="Messages">
      <ChatShell currentUserId={profile.id} />
    </AppShell>
  );
}
