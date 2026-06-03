export type Role = "user" | "moderator" | "admin";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type NoRelationships = [];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_path: string | null;
          bio: string | null;
          role: Role;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_path?: string | null;
          bio?: string | null;
          role?: Role;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_path?: string | null;
          bio?: string | null;
          role?: Role;
          last_seen_at?: string | null;
        };
        Relationships: NoRelationships;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          body: string | null;
          image_path: string | null;
          image_bytes: number;
          storage_bucket: string;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          author_id: string;
          body?: string | null;
          image_path?: string | null;
          image_bytes?: number;
          storage_bucket?: string;
        };
        Update: {
          body?: string | null;
          image_path?: string | null;
          image_bytes?: number;
        };
        Relationships: NoRelationships;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          author_id: string;
          body: string;
        };
        Update: {
          body?: string;
        };
        Relationships: NoRelationships;
      };
      likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      dislikes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      saved_posts: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          marked_fraudulent: boolean;
          moderator_id: string | null;
          admin_notes: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          post_id: string;
          reporter_id: string;
          reason: string;
        };
        Update: {
          marked_fraudulent?: boolean;
          moderator_id?: string | null;
          admin_notes?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: NoRelationships;
      };
      conversations: {
        Row: {
          id: string;
          created_by: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: { created_by: string };
        Update: { last_message_at?: string };
        Relationships: NoRelationships;
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          read_at?: string | null;
        };
        Update: { read_at?: string | null };
        Relationships: NoRelationships;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          post_id: string | null;
          conversation_id: string | null;
          kind: string;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          actor_id?: string | null;
          post_id?: string | null;
          conversation_id?: string | null;
          kind: string;
          title: string;
          body?: string | null;
        };
        Update: { read_at?: string | null };
        Relationships: NoRelationships;
      };
      upload_events: {
        Row: {
          id: string;
          user_id: string;
          bytes: number;
          kind: string;
          created_at: string;
        };
        Insert: { user_id: string; bytes: number; kind: string };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      action_rate_limits: {
        Row: {
          id: string;
          user_id: string | null;
          ip_hash: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          ip_hash?: string | null;
          action: string;
        };
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_upload_bytes: {
        Args: { p_user: string; p_bytes: number };
        Returns: boolean;
      };
      check_rate_limit: {
        Args: {
          p_action: string;
          p_limit: number;
          p_window_seconds: number;
          p_ip_hash?: string | null;
        };
        Returns: boolean;
      };
      cleanup_expired_posts: {
        Args: Record<string, never>;
        Returns: number;
      };
      daily_uploaded_bytes: {
        Args: { p_user: string };
        Returns: number;
      };
      expired_post_media_paths: {
        Args: Record<string, never>;
        Returns: { id: string; bucket: string; path: string }[];
      };
      get_feed_posts: {
        Args: {
          p_viewer: string | null;
          p_limit?: number;
          p_cursor?: string | null;
          p_scope?: string;
          p_username?: string | null;
        };
        Returns: FeedPostRow[];
      };
      mark_report_fraudulent: {
        Args: { p_report_id: string; p_value: boolean };
        Returns: Database["public"]["Tables"]["reports"]["Row"];
      };
      register_upload_event: {
        Args: { p_bytes: number; p_kind: string };
        Returns: undefined;
      };
      saved_posts_bytes: {
        Args: { p_user: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type FeedPostRow = {
  id: string;
  body: string | null;
  image_path: string | null;
  image_bytes: number;
  created_at: string;
  expires_at: string;
  author_id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
  role: Role;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  viewer_reaction: "like" | "dislike" | null;
  viewer_saved: boolean;
};

export type FeedPost = FeedPostRow & {
  image_url: string | null;
  avatar_url: string | null;
};

export type SessionProfile = Database["public"]["Tables"]["users"]["Row"];
