"use client";

import Link from "next/link";
import { Bookmark, Home, MessageCircle, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";

export function MobileNav({ role }: { role: Role }) {
  const staff = role === "admin" || role === "moderator";
  const items = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/saved", label: "Save", icon: Bookmark },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/settings", label: "Profil", icon: Settings },
    ...(staff ? [{ href: "/admin", label: "Mod", icon: Shield }] : [])
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className={cn("mx-auto grid max-w-lg gap-1", staff ? "grid-cols-5" : "grid-cols-4")}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold text-zinc-400 transition hover:bg-panelSoft hover:text-white"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
