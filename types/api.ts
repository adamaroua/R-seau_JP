import type { FeedPost, Role } from "@/types/database";

export type ApiErrorBody = {
  error: string;
};

export type FeedResponse = {
  posts: FeedPost[];
  nextCursor: string | null;
};

export type CommentResponse = {
  comments: Array<{
    id: string;
    body: string;
    created_at: string;
    author: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      role: Role;
    };
  }>;
};

export type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};
