"use client";

import { FormEvent, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { cn, timeAgo } from "@/lib/utils";
import type { CommentResponse } from "@/types/api";

type CommentItem = CommentResponse["comments"][number];

export function CommentsPanel({ postId, onAdded }: { postId: string; onAdded: () => void }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/posts/${postId}/comments`);
    const json = (await response.json()) as CommentResponse;
    setComments(json.comments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [postId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (response.ok) {
      setBody("");
      await load();
      onAdded();
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={360}
          placeholder="Repondre"
          className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-sky text-ink transition hover:bg-sky/90"
          type="submit"
          title="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-3 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Chargement...</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <UserAvatar
                username={comment.author.username}
                avatarUrl={comment.author.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1 rounded-md bg-ink px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("font-black", usernameColor(comment.author.role))}>
                    @{comment.author.username}
                  </span>
                  <RoleBadge role={comment.author.role} compact />
                  <span className="text-zinc-500">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-200">{comment.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
