-- Optional helper after your first signup.
-- Replace jp_admin with your username, then run this in the Supabase SQL editor.

update public.users
set role = 'admin'
where username = 'jp_admin';
