"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FeedResponse } from "@/types/api";
import type { FeedPost } from "@/types/database";

type FeedScope = "all" | "saved" | "user";

export function useInfiniteFeed({
  scope = "all",
  username
}: {
  scope?: FeedScope;
  username?: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const buildUrl = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams({ scope });
      if (username) params.set("username", username);
      if (nextCursor) params.set("cursor", nextCursor);
      return `/api/posts?${params.toString()}`;
    },
    [scope, username]
  );

  const load = useCallback(
    async (nextCursor?: string | null, replace = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(buildUrl(nextCursor));
        const json = (await response.json()) as FeedResponse | { error?: string };
        if (!response.ok) throw new Error("error" in json ? json.error : "Erreur feed");

        const feed = json as FeedResponse;
        setPosts((current) => (replace ? feed.posts : [...current, ...feed.posts]));
        setCursor(feed.nextCursor);
        setDone(feed.nextCursor === null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur feed");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [buildUrl]
  );

  const refresh = useCallback(() => load(null, true), [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (scope !== "all") return;
    const channel = supabase
      .channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, scope, supabase]);

  const removePost = useCallback((id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id));
  }, []);

  return {
    posts,
    loading,
    error,
    done,
    loadMore: () => {
      if (!done && cursor) void load(cursor, false);
    },
    refresh,
    removePost
  };
}
