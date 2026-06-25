import Link from "next/link";
import { Bookmark, Home, MessageCircle, Settings, Shield, UserRound } from "lucide-react";
import { AdPlaceholder } from "@/components/shared/AdPlaceholder";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";

type ShellProfile = {
  id: string;
  username: string;
  display_name: string | null;
  role: Role;
  avatar_url: string | null;
};

const links = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/saved", label: "Sauvegardes", icon: Bookmark },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/settings", label: "Profil", icon: Settings }
];

export function Sidebar({ profile }: { profile: ShellProfile }) {
  const staff = profile.role === "admin" || profile.role === "moderator";

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line bg-ink/75 px-4 py-5 lg:block">
      <Link href="/feed" className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-danger font-black text-white">JP</div>
        <div>
          <p className="text-lg font-black leading-tight">Jean Prevost</p>
          <p className="text-xs text-zinc-500">reseau du lycee</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-panelSoft hover:text-white"
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
        {staff && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-panelSoft hover:text-white"
          >
            <Shield className="h-5 w-5" />
            Moderation
          </Link>
        )}
      </nav>

      <div className="mt-8 rounded-md border border-line bg-panel p-3">
        <div className="flex items-center gap-3">
          <UserAvatar username={profile.username} avatarUrl={profile.avatar_url} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn("truncate text-sm font-black", usernameColor(profile.role))}>
                @{profile.username}
              </p>
              <RoleBadge role={profile.role} compact />
            </div>
            <p className="truncate text-xs text-zinc-500">{profile.display_name ?? "Jean Prevost"}</p>
          </div>
        </div>
        <Link
          href={`/profile/${profile.username}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-sky/60 hover:text-white"
        >
          <UserRound className="h-4 w-4" />
          Voir profil
        </Link>
      </div>

      <div className="mt-4">
        <AdPlaceholder compact />
      </div>
    </aside>
  );
}
