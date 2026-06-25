"use client";

import { useEffect, useRef } from "react";
import { Bookmark, Radio } from "lucide-react";
import { Composer } from "@/components/feed/Composer";
import { PostCard } from "@/components/feed/PostCard";
import { AdPlaceholder } from "@/components/shared/AdPlaceholder";
import { EmptyState } from "@/components/shared/EmptyState";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import type { Role } from "@/types/database";

export function Feed({
  currentUser,
  scope = "all",
  username
}: {
  currentUser: {
    id: string;
    username: string;
    role: Role;
    avatar_url: string | null;
  };
  scope?: "all" | "saved" | "user";
  username?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { posts, loading, done, error, loadMore, refresh, removePost } = useInfiniteFeed({
    scope,
    username
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-3 py-5 xl:grid-cols-[minmax(0,720px)_300px]">
      <section className="min-w-0 space-y-4">
        {scope === "all" && (
          <Composer
            username={currentUser.username}
            avatarUrl={currentUser.avatar_url}
            onPosted={refresh}
          />
        )}

        {error && <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

        {!loading && posts.length === 0 && (
          <EmptyState
            icon={scope === "saved" ? Bookmark : Radio}
            title={scope === "saved" ? "Aucun post sauvegarde" : "Le feed est calme"}
            body={scope === "saved" ? "Les posts sauvegardes apparaitront ici." : "Le premier post donnera le ton."}
          />
        )}

        {posts.map((post, index) => (
          <div key={post.id} className="space-y-4">
            <PostCard
              post={post}
              currentUserId={currentUser.id}
              currentRole={currentUser.role}
              onDeleted={removePost}
            />
            {(index + 1) % 6 === 0 && <AdPlaceholder />}
          </div>
        ))}

        {loading && <div className="rounded-md border border-line bg-panel p-4 text-sm text-zinc-400">Chargement...</div>}
        <div ref={sentinelRef} className="h-8" />
        {done && posts.length > 0 && <p className="py-4 text-center text-sm text-zinc-500">Fin du feed.</p>}
      </section>

      <aside className="hidden space-y-4 xl:block">
        <AdPlaceholder />
        <div className="rounded-md border border-line bg-panel p-4">
          <p className="text-sm font-black text-white">Tendances du lycee</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            {["#bac", "#cantine", "#sport", "#revision", "#sorties"].map((tag) => (
              <span key={tag} className="rounded-md bg-panelSoft px-2 py-1 text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
