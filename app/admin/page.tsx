import { AdminDashboard } from "@/components/moderation/AdminDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { requireStaffProfile } from "@/lib/auth";
import { toShellProfile } from "@/lib/shell";

export default async function AdminPage() {
  const profile = await requireStaffProfile();
  const shellProfile = await toShellProfile(profile);

  return (
    <AppShell profile={shellProfile} title="Moderation">
      <AdminDashboard role={profile.role} />
    </AppShell>
  );
}
