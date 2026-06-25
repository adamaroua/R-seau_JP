"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ThumbsDown,
  Trash2
} from "lucide-react";
import { CommentsPanel } from "@/components/feed/CommentsPanel";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn, formatCount, timeAgo } from "@/lib/utils";
import type { FeedPost, Role } from "@/types/database";

export function PostCard({
  post,
  currentUserId,
  currentRole,
  onDeleted
}: {
  post: FeedPost;
  currentUserId: string;
  currentRole: Role;
  onDeleted: (id: string) => void;
}) {
  const [localPost, setLocalPost] = useState(post);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const canDelete = localPost.author_id === currentUserId || currentRole === "admin";

  async function react(kind: "like" | "dislike") {
    const response = await fetch(`/api/posts/${localPost.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind })
    });
    const json = await response.json();
    if (response.ok) {
      setLocalPost((current) => ({
        ...current,
        like_count: json.like_count,
        dislike_count: json.dislike_count,
        viewer_reaction: json.viewer_reaction
      }));
    }
  }

  async function toggleSave() {
    const response = await fetch(`/api/posts/${localPost.id}/save`, { method: "POST" });
    const json = await response.json();
    if (response.ok) setLocalPost((current) => ({ ...current, viewer_saved: json.saved }));
  }

  async function remove() {
    const response = await fetch(`/api/posts/${localPost.id}`, { method: "DELETE" });
    if (response.ok) onDeleted(localPost.id);
  }

  async function report() {
    if (reportReason.trim().length < 4) return;
    const response = await fetch(`/api/posts/${localPost.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason })
    });
    if (response.ok) {
      setReportReason("");
      setReportOpen(false);
    }
  }

  return (
    <article className="rounded-md border border-line bg-panel p-4 shadow-glow">
      <div className="flex gap-3">
        <Link href={`/profile/${localPost.username}`}>
          <UserAvatar username={localPost.username} avatarUrl={localPost.avatar_url} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${localPost.username}`}
                  className={cn("truncate font-black", usernameColor(localPost.role))}
                >
                  @{localPost.username}
                </Link>
                <RoleBadge role={localPost.role} />
                <span className="text-xs text-zinc-500">{timeAgo(localPost.created_at)}</span>
              </div>
              {localPost.display_name && (
                <p className="truncate text-xs text-zinc-500">{localPost.display_name}</p>
              )}
            </div>

            <div className="relative">
              <button
                className="focus-ring grid h-8 w-8 place-items-center rounded-md text-zinc-400 transition hover:bg-panelSoft hover:text-white"
                onClick={() => setMenuOpen((value) => !value)}
                type="button"
                title="Options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-line bg-ink p-1 shadow-glow">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-panelSoft hover:text-white"
                    type="button"
                    onClick={() => {
                      setReportOpen((value) => !value);
                      setMenuOpen(false);
                    }}
                  >
                    <Flag className="h-4 w-4" />
                    Signaler
                  </button>
                  {canDelete && (
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                      type="button"
                      onClick={remove}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {localPost.body && (
            <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-100">
              {localPost.body}
            </p>
          )}

          {localPost.image_url && (
            <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-md border border-line bg-ink sm:aspect-[16/10]">
              <Image src={localPost.image_url} alt="" fill sizes="(max-width: 768px) 92vw, 680px" className="object-cover" />
            </div>
          )}

          {reportOpen && (
            <div className="mt-3 rounded-md border border-line bg-ink p-3">
              <textarea
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Pourquoi ce post pose probleme ?"
                className="focus-ring w-full resize-none rounded-md border border-line bg-panel px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 hover:text-white"
                  type="button"
                  onClick={() => setReportOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="rounded-md bg-danger px-3 py-2 text-sm font-black text-white"
                  type="button"
                  onClick={report}
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-4 gap-1 text-sm text-zinc-400">
            <button
              className={cn(
                "focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2 transition hover:bg-danger/10 hover:text-danger",
                localPost.viewer_reaction === "like" && "text-danger"
              )}
              onClick={() => react("like")}
              type="button"
              title="Like"
            >
              <Heart className="h-4 w-4" />
              {formatCount(localPost.like_count)}
            </button>
            <button
              className={cn(
                "focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2 transition hover:bg-sky/10 hover:text-sky",
                localPost.viewer_reaction === "dislike" && "text-sky"
              )}
              onClick={() => react("dislike")}
              type="button"
              title="Dislike"
            >
              <ThumbsDown className="h-4 w-4" />
              {formatCount(localPost.dislike_count)}
            </button>
            <button
              className="focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2 transition hover:bg-panelSoft hover:text-white"
              onClick={() => setCommentsOpen((value) => !value)}
              type="button"
              title="Commentaires"
            >
              <MessageCircle className="h-4 w-4" />
              {formatCount(localPost.comment_count)}
            </button>
            <button
              className={cn(
                "focus-ring flex items-center justify-center gap-2 rounded-md px-2 py-2 transition hover:bg-note/10 hover:text-note",
                localPost.viewer_saved && "text-note"
              )}
              onClick={toggleSave}
              type="button"
              title="Sauvegarder"
            >
              <Bookmark className="h-4 w-4" />
              {localPost.viewer_saved ? "OK" : ""}
            </button>
          </div>

          {commentsOpen && (
            <CommentsPanel
              postId={localPost.id}
              onAdded={() =>
                setLocalPost((current) => ({
                  ...current,
                  comment_count: current.comment_count + 1
                }))
              }
            />
          )}
        </div>
      </div>
    </article>
  );
}
