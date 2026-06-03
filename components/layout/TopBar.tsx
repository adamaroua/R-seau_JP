import { NotificationsButton } from "@/components/layout/NotificationsButton";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";

type TopBarProps = {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    role: Role;
    avatar_url: string | null;
  };
  title: string;
};

export function TopBar({ profile, title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/86 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black tracking-normal text-white">{title}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className={cn("font-bold", usernameColor(profile.role))}>@{profile.username}</span>
            <RoleBadge role={profile.role} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton userId={profile.id} />
          <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} />
        </div>
      </div>
    </header>
  );
}
