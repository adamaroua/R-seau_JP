"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationItem } from "@/types/api";

export function NotificationsButton({ userId }: { userId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setItems(data.notifications ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setItems((current) => [payload.new as NotificationItem, ...current].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() }))
    );
  }

  return (
    <div className="relative">
      <button
        className="focus-ring relative grid h-10 w-10 place-items-center rounded-md border border-line bg-panelSoft text-zinc-200 transition hover:border-sky/60 hover:text-white"
        onClick={() => setOpen((value) => !value)}
        title="Notifications"
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-black text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-line bg-panel p-2 shadow-glow">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-bold">Notifications</p>
            <button
              className="focus-ring rounded-md p-1 text-zinc-400 hover:bg-panelSoft hover:text-white"
              onClick={markRead}
              type="button"
              title="Tout marquer comme lu"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-zinc-500">Rien pour le moment.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm",
                    item.read_at ? "text-zinc-400" : "bg-panelSoft text-white"
                  )}
                >
                  <div className="font-semibold">{item.title}</div>
                  {item.body && <div className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{item.body}</div>}
                  <div className="mt-1 text-[11px] text-zinc-500">{timeAgo(item.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
