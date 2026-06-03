import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { Role } from "@/types/database";

export type ShellProfile = {
  id: string;
  username: string;
  display_name: string | null;
  role: Role;
  avatar_url: string | null;
};

export function AppShell({
  profile,
  title,
  children
}: {
  profile: ShellProfile;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="mx-auto flex max-w-[1480px]">
        <Sidebar profile={profile} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <TopBar profile={profile} title={title} />
          {children}
        </main>
      </div>
      <MobileNav role={profile.role} />
    </div>
  );
}
