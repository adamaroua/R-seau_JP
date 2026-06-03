"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge, usernameColor } from "@/components/shared/RoleBadge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, timeAgo } from "@/lib/utils";
import type { Role } from "@/types/database";

type Conversation = {
  id: string;
  last_message_at: string;
  last_message: string | null;
  other: {
    id: string;
    username: string;
    display_name: string | null;
    role: Role;
    avatar_url: string | null;
  } | null;
};

type Message = {
  id: string;
  conversation_id: string;
  body: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    role: Role;
    avatar_url: string | null;
  };
};

export function ChatShell({ currentUserId }: { currentUserId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadConversations(nextActive?: string) {
    const response = await fetch("/api/chat/conversations");
    const json = await response.json();
    const loaded = (json.conversations ?? []) as Conversation[];
    setConversations(loaded);
    if (nextActive) setActiveId(nextActive);
    else if (!activeId && loaded[0]) setActiveId(loaded[0].id);
  }

  async function loadMessages(conversationId: string) {
    const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
    const json = await response.json();
    setMessages((json.messages ?? []) as Message[]);
  }

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeId);

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`
        },
        () => {
          void loadMessages(activeId);
          void loadConversations(activeId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase]);

  async function createConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Conversation impossible");
      return;
    }
    setUsername("");
    await loadConversations(json.id);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;
    const body = draft;
    setDraft("");
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, body })
    });
    if (!response.ok) setDraft(body);
  }

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-3 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-md border border-line bg-panel p-3 lg:h-[calc(100vh-7.5rem)]">
        <form onSubmit={createConversation} className="flex gap-2">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="pseudo"
            className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm"
          />
          <button
            className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-danger text-white"
            title="Nouvelle conversation"
            type="submit"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
        {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}

        <div className="mt-4 space-y-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setActiveId(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md p-2 text-left transition",
                conversation.id === activeId ? "bg-panelSoft" : "hover:bg-panelSoft"
              )}
            >
              <UserAvatar
                username={conversation.other?.username ?? "jp"}
                avatarUrl={conversation.other?.avatar_url ?? null}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-sm font-black",
                      usernameColor(conversation.other?.role ?? "user")
                    )}
                  >
                    @{conversation.other?.username ?? "conversation"}
                  </span>
                  {conversation.other && <RoleBadge role={conversation.other.role} compact />}
                </div>
                <p className="truncate text-xs text-zinc-500">{conversation.last_message ?? "Aucun message"}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-md border border-line bg-panel shadow-glow lg:h-[calc(100vh-7.5rem)]">
        <header className="border-b border-line px-4 py-3">
          {activeConversation?.other ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                username={activeConversation.other.username}
                avatarUrl={activeConversation.other.avatar_url}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className={cn("font-black", usernameColor(activeConversation.other.role))}>
                    @{activeConversation.other.username}
                  </p>
                  <RoleBadge role={activeConversation.other.role} />
                </div>
                <p className="text-xs text-zinc-500">{activeConversation.other.display_name ?? "Jean Prevost"}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400">
              <MessageCircle className="h-5 w-5" />
              Messages
            </div>
          )}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => {
            const mine = message.sender.id === currentUserId;
            return (
              <div key={message.id} className={cn("flex gap-2", mine && "justify-end")}>
                {!mine && (
                  <UserAvatar
                    username={message.sender.username}
                    avatarUrl={message.sender.avatar_url}
                    size="sm"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-md px-3 py-2 text-sm",
                    mine ? "bg-danger text-white" : "bg-ink text-zinc-100"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={cn("mt-1 text-[11px]", mine ? "text-white/65" : "text-zinc-500")}>
                    {timeAgo(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!activeId}
            placeholder="Message"
            className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm disabled:opacity-60"
          />
          <button
            className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-sky text-ink disabled:opacity-60"
            disabled={!activeId}
            type="submit"
            title="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
