-- Jean Prevost social network schema for Supabase.
-- Run this file once in the Supabase SQL editor, then set the environment variables from .env.example.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists public.roles (
  name text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (name, label)
values
  ('user', 'Utilisateur'),
  ('moderator', 'Moderateur'),
  ('admin', 'Admin')
on conflict (name) do update set label = excluded.label;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text,
  avatar_path text,
  bio text,
  role text not null default 'user' references public.roles(name),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  body text,
  image_path text,
  image_bytes bigint not null default 0 check (image_bytes >= 0),
  storage_bucket text not null default 'post-media',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 days'),
  constraint posts_content_check check (
    (body is not null and length(trim(body)) > 0 and length(body) <= 560)
    or image_path is not null
  )
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 360),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.dislikes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.saved_posts (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason text not null check (length(trim(reason)) between 4 and 500),
  marked_fraudulent boolean not null default false,
  moderator_id uuid references public.users(id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (post_id, reporter_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.upload_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bytes bigint not null check (bytes >= 0),
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.action_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  ip_hash text,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_username_idx on public.users (username);
create index if not exists users_role_idx on public.users (role);
create index if not exists posts_feed_idx on public.posts (created_at desc, expires_at);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists posts_expiry_idx on public.posts (expires_at);
create index if not exists comments_post_idx on public.comments (post_id, created_at asc);
create index if not exists likes_post_idx on public.likes (post_id);
create index if not exists dislikes_post_idx on public.dislikes (post_id);
create index if not exists saved_posts_user_idx on public.saved_posts (user_id, created_at desc);
create index if not exists reports_open_idx on public.reports (created_at desc, marked_fraudulent);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at asc);
create index if not exists notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index if not exists upload_events_user_day_idx on public.upload_events (user_id, created_at desc);
create index if not exists rate_limits_idx on public.action_rate_limits (action, user_id, ip_hash, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> new.role
    and coalesce(auth.role(), '') <> 'service_role'
    and session_user <> 'postgres'
    and not public.is_admin()
  then
    raise exception 'role changes require admin';
  end if;

  return new;
end;
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists prevent_role_escalation_trigger on public.users;
create trigger prevent_role_escalation_trigger
before update on public.users
for each row execute function public.prevent_role_escalation();

drop trigger if exists touch_posts_updated_at on public.posts;
create trigger touch_posts_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'user');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin', 'moderator');
$$;

create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', 'jp_' || substr(new.id::text, 1, 8)), '[^a-z0-9_]', '', 'g'));

  if length(base_username) < 3 then
    base_username := 'jp_' || substr(new.id::text, 1, 8);
  end if;

  candidate := left(base_username, 24);

  loop
    begin
      insert into public.users (id, username, display_name)
      values (new.id, candidate, nullif(new.raw_user_meta_data->>'display_name', ''));
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      candidate := left(base_username, 20) || '_' || suffix::text;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.can_upload_bytes(p_user uuid, p_bytes bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select sum(bytes)
    from public.upload_events
    where user_id = p_user
      and created_at >= date_trunc('day', now())
  ), 0) + greatest(p_bytes, 0) <= 10485760;
$$;

create or replace function public.daily_uploaded_bytes(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select sum(bytes)
    from public.upload_events
    where user_id = p_user
      and created_at >= date_trunc('day', now())
  ), 0)::bigint;
$$;

create or replace function public.saved_posts_bytes(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select sum(p.image_bytes)
    from public.saved_posts sp
    join public.posts p on p.id = sp.post_id
    where sp.user_id = p_user
  ), 0)::bigint;
$$;

create or replace function public.register_upload_event(p_bytes bigint, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if not public.can_upload_bytes(auth.uid(), p_bytes) then
    raise exception 'daily upload quota exceeded';
  end if;

  insert into public.upload_events (user_id, bytes, kind)
  values (auth.uid(), greatest(p_bytes, 0), p_kind);
end;
$$;

create or replace function public.check_rate_limit(
  p_action text,
  p_limit int,
  p_window_seconds int,
  p_ip_hash text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  current_user_id uuid := auth.uid();
begin
  select count(*) into recent_count
  from public.action_rate_limits arl
  where arl.action = p_action
    and arl.created_at >= now() - make_interval(secs => greatest(p_window_seconds, 1))
    and (
      (current_user_id is not null and arl.user_id = current_user_id)
      or (p_ip_hash is not null and arl.ip_hash = p_ip_hash)
    );

  if recent_count >= greatest(p_limit, 1) then
    return false;
  end if;

  insert into public.action_rate_limits (user_id, ip_hash, action)
  values (current_user_id, p_ip_hash, p_action);

  return true;
end;
$$;

create or replace function public.ensure_post_upload_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.image_bytes, 0) > 0 and not public.can_upload_bytes(new.author_id, new.image_bytes) then
    raise exception 'daily upload quota exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_post_spam_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_hour integer;
  recent_minute integer;
begin
  select count(*) into recent_hour
  from public.posts
  where author_id = new.author_id
    and created_at >= now() - interval '1 hour';

  select count(*) into recent_minute
  from public.posts
  where author_id = new.author_id
    and created_at >= now() - interval '1 minute';

  if recent_hour >= 8 or recent_minute >= 2 then
    raise exception 'post rate limit exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_comment_spam_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_hour integer;
begin
  select count(*) into recent_hour
  from public.comments
  where author_id = new.author_id
    and created_at >= now() - interval '1 hour';

  if recent_hour >= 20 then
    raise exception 'comment rate limit exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_message_spam_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_hour integer;
begin
  select count(*) into recent_hour
  from public.messages
  where sender_id = new.sender_id
    and created_at >= now() - interval '1 hour';

  if recent_hour >= 80 then
    raise exception 'message rate limit exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_report_spam_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_hour integer;
begin
  select count(*) into recent_hour
  from public.reports
  where reporter_id = new.reporter_id
    and created_at >= now() - interval '1 hour';

  if recent_hour >= 10 then
    raise exception 'report rate limit exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.record_post_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.image_bytes, 0) > 0 then
    insert into public.upload_events (user_id, bytes, kind)
    values (new.author_id, new.image_bytes, 'post');
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_post_upload_quota_trigger on public.posts;
create trigger ensure_post_upload_quota_trigger
before insert on public.posts
for each row execute function public.ensure_post_upload_quota();

drop trigger if exists enforce_post_spam_limit_trigger on public.posts;
create trigger enforce_post_spam_limit_trigger
before insert on public.posts
for each row execute function public.enforce_post_spam_limit();

drop trigger if exists record_post_upload_trigger on public.posts;
create trigger record_post_upload_trigger
after insert on public.posts
for each row execute function public.record_post_upload();

drop trigger if exists enforce_comment_spam_limit_trigger on public.comments;
create trigger enforce_comment_spam_limit_trigger
before insert on public.comments
for each row execute function public.enforce_comment_spam_limit();

drop trigger if exists enforce_message_spam_limit_trigger on public.messages;
create trigger enforce_message_spam_limit_trigger
before insert on public.messages
for each row execute function public.enforce_message_spam_limit();

drop trigger if exists enforce_report_spam_limit_trigger on public.reports;
create trigger enforce_report_spam_limit_trigger
before insert on public.reports
for each row execute function public.enforce_report_spam_limit();

create or replace function public.ensure_saved_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_bytes bigint;
  new_bytes bigint;
begin
  select coalesce(sum(p.image_bytes), 0)
    into total_bytes
  from public.saved_posts sp
  join public.posts p on p.id = sp.post_id
  where sp.user_id = new.user_id;

  select coalesce(image_bytes, 0)
    into new_bytes
  from public.posts
  where id = new.post_id;

  if total_bytes + coalesce(new_bytes, 0) > 26214400 then
    raise exception 'saved storage quota exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_saved_quota_trigger on public.saved_posts;
create trigger ensure_saved_quota_trigger
before insert on public.saved_posts
for each row execute function public.ensure_saved_quota();

create or replace function public.remove_opposite_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'likes' then
    delete from public.dislikes where post_id = new.post_id and user_id = new.user_id;
  else
    delete from public.likes where post_id = new.post_id and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists remove_dislike_after_like on public.likes;
create trigger remove_dislike_after_like
after insert on public.likes
for each row execute function public.remove_opposite_reaction();

drop trigger if exists remove_like_after_dislike on public.dislikes;
create trigger remove_like_after_dislike
after insert on public.dislikes
for each row execute function public.remove_opposite_reaction();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select author_id into owner_id from public.posts where id = new.post_id;

  if owner_id is not null and owner_id <> new.author_id then
    insert into public.notifications (user_id, actor_id, post_id, kind, title, body)
    values (owner_id, new.author_id, new.post_id, 'comment', 'Nouveau commentaire', left(new.body, 160));
  end if;

  return new;
end;
$$;

drop trigger if exists notify_comment_trigger on public.comments;
create trigger notify_comment_trigger
after insert on public.comments
for each row execute function public.notify_comment();

create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select author_id into owner_id from public.posts where id = new.post_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, post_id, kind, title)
    values (owner_id, new.user_id, new.post_id, 'like', 'Nouveau like');
  end if;

  return new;
end;
$$;

drop trigger if exists notify_like_trigger on public.likes;
create trigger notify_like_trigger
after insert on public.likes
for each row execute function public.notify_like();

create or replace function public.notify_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, post_id, kind, title, body)
  select u.id, new.reporter_id, new.post_id, 'report', 'Nouveau signalement', left(new.reason, 160)
  from public.users u
  where u.role = 'admin';

  return new;
end;
$$;

drop trigger if exists notify_report_trigger on public.reports;
create trigger notify_report_trigger
after insert on public.reports
for each row execute function public.notify_report();

create or replace function public.notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  insert into public.notifications (user_id, actor_id, conversation_id, kind, title, body)
  select cm.user_id, new.sender_id, new.conversation_id, 'message', 'Nouveau message', left(new.body, 160)
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;

  return new;
end;
$$;

drop trigger if exists notify_message_trigger on public.messages;
create trigger notify_message_trigger
after insert on public.messages
for each row execute function public.notify_message();

create or replace function public.mark_report_fraudulent(p_report_id uuid, p_value boolean)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_report public.reports;
begin
  if not public.is_moderator() then
    raise exception 'not allowed';
  end if;

  update public.reports
  set marked_fraudulent = p_value,
      moderator_id = auth.uid(),
      reviewed_at = now()
  where id = p_report_id
  returning * into updated_report;

  return updated_report;
end;
$$;

create or replace function public.get_feed_posts(
  p_viewer uuid,
  p_limit int default 15,
  p_cursor timestamptz default null,
  p_scope text default 'all',
  p_username text default null
)
returns table (
  id uuid,
  body text,
  image_path text,
  image_bytes bigint,
  created_at timestamptz,
  expires_at timestamptz,
  author_id uuid,
  username text,
  display_name text,
  avatar_path text,
  role text,
  like_count bigint,
  dislike_count bigint,
  comment_count bigint,
  viewer_reaction text,
  viewer_saved boolean
)
language sql
stable
set search_path = public
as $$
  select
    p.id,
    p.body,
    p.image_path,
    p.image_bytes,
    p.created_at,
    p.expires_at,
    u.id as author_id,
    u.username::text,
    u.display_name,
    u.avatar_path,
    u.role,
    (select count(*) from public.likes l where l.post_id = p.id) as like_count,
    (select count(*) from public.dislikes d where d.post_id = p.id) as dislike_count,
    (select count(*) from public.comments c where c.post_id = p.id) as comment_count,
    case
      when p_viewer is null then null
      when exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = p_viewer) then 'like'
      when exists (select 1 from public.dislikes d where d.post_id = p.id and d.user_id = p_viewer) then 'dislike'
      else null
    end as viewer_reaction,
    case
      when p_viewer is null then false
      else exists (select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = p_viewer)
    end as viewer_saved
  from public.posts p
  join public.users u on u.id = p.author_id
  where p.expires_at > now()
    and (p_cursor is null or p.created_at < p_cursor)
    and (p_scope <> 'saved' or exists (
      select 1 from public.saved_posts sp where sp.post_id = p.id and sp.user_id = p_viewer
    ))
    and (p_scope <> 'user' or u.username = p_username)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 30);
$$;

create or replace function public.expired_post_media_paths()
returns table (id uuid, bucket text, path text)
language sql
security definer
set search_path = public
as $$
  select id, storage_bucket, image_path
  from public.posts
  where expires_at <= now()
    and image_path is not null;
$$;

create or replace function public.cleanup_expired_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.posts
  where expires_at <= now();

  get diagnostics removed = row_count;
  return removed;
end;
$$;

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.dislikes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.reports enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.upload_events enable row level security;
alter table public.action_rate_limits enable row level security;

drop policy if exists "roles_select_all" on public.roles;
create policy "roles_select_all" on public.roles for select using (true);

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated" on public.users
for select to authenticated using (true);

drop policy if exists "users_update_own_safe" on public.users;
create policy "users_update_own_safe" on public.users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_role());

drop policy if exists "users_admin_update" on public.users;
create policy "users_admin_update" on public.users
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "posts_select_live" on public.posts;
create policy "posts_select_live" on public.posts
for select to authenticated using (expires_at > now());

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
for insert to authenticated
with check (author_id = auth.uid());

drop policy if exists "posts_delete_own_or_admin" on public.posts;
create policy "posts_delete_own_or_admin" on public.posts
for delete to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists "comments_select_live_posts" on public.comments;
create policy "comments_select_live_posts" on public.comments
for select to authenticated using (
  exists (select 1 from public.posts p where p.id = post_id and p.expires_at > now())
);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
for insert to authenticated
with check (author_id = auth.uid());

drop policy if exists "comments_delete_own_or_admin" on public.comments;
create policy "comments_delete_own_or_admin" on public.comments
for delete to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes for select to authenticated using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes
for delete to authenticated using (user_id = auth.uid());

drop policy if exists "dislikes_select" on public.dislikes;
create policy "dislikes_select" on public.dislikes for select to authenticated using (true);

drop policy if exists "dislikes_insert_own" on public.dislikes;
create policy "dislikes_insert_own" on public.dislikes
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "dislikes_delete_own" on public.dislikes;
create policy "dislikes_delete_own" on public.dislikes
for delete to authenticated using (user_id = auth.uid());

drop policy if exists "saved_posts_select_own" on public.saved_posts;
create policy "saved_posts_select_own" on public.saved_posts
for select to authenticated using (user_id = auth.uid());

drop policy if exists "saved_posts_insert_own" on public.saved_posts;
create policy "saved_posts_insert_own" on public.saved_posts
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saved_posts_delete_own" on public.saved_posts;
create policy "saved_posts_delete_own" on public.saved_posts
for delete to authenticated using (user_id = auth.uid());

drop policy if exists "reports_select_own_or_staff" on public.reports;
create policy "reports_select_own_or_staff" on public.reports
for select to authenticated using (reporter_id = auth.uid() or public.is_moderator());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "reports_staff_update" on public.reports;
create policy "reports_staff_update" on public.reports
for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member" on public.conversations
for select to authenticated using (public.is_conversation_member(id));

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "conversation_members_select_member" on public.conversation_members;
create policy "conversation_members_select_member" on public.conversation_members
for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "conversation_members_insert_self" on public.conversation_members;
create policy "conversation_members_insert_self" on public.conversation_members
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "conversation_members_update_self" on public.conversation_members;
create policy "conversation_members_update_self" on public.conversation_members
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member" on public.messages
for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "upload_events_select_own" on public.upload_events;
create policy "upload_events_select_own" on public.upload_events
for select to authenticated using (user_id = auth.uid());

drop policy if exists "rate_limits_insert" on public.action_rate_limits;
create policy "rate_limits_insert" on public.action_rate_limits
for insert to authenticated with check (user_id = auth.uid() or user_id is null);

drop policy if exists "rate_limits_select_staff" on public.action_rate_limits;
create policy "rate_limits_select_staff" on public.action_rate_limits
for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_authenticated" on storage.objects;
create policy "avatars_select_authenticated" on storage.objects
for select to authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder" on storage.objects
for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder" on storage.objects
for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_media_select_authenticated" on storage.objects;
create policy "post_media_select_authenticated" on storage.objects
for select to authenticated using (bucket_id = 'post-media');

drop policy if exists "post_media_insert_own_folder" on storage.objects;
create policy "post_media_insert_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_media_delete_own_or_admin" on storage.objects;
create policy "post_media_delete_own_or_admin" on storage.objects
for delete to authenticated using (
  bucket_id = 'post-media'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.posts;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.comments;
  exception when duplicate_object then
    null;
  end;
end $$;
