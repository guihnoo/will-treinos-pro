-- Feed moderation layer for owner/admin:
-- - pin posts
-- - official announcements
-- - role-targeted communication
-- - soft delete

alter table public.feed_posts
  add column if not exists pinned boolean not null default false,
  add column if not exists is_official boolean not null default false,
  add column if not exists target_role text not null default 'all',
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feed_posts_target_role_check'
      and conrelid = 'public.feed_posts'::regclass
  ) then
    alter table public.feed_posts
      add constraint feed_posts_target_role_check
      check (target_role in ('all', 'student', 'coach'));
  end if;
end $$;

create or replace function public.wt_is_staff()
returns boolean
language sql
stable
as $$
  select lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) in ('admin', 'will_owner', 'owner', 'coach', 'professor', 'teacher');
$$;

drop policy if exists "feed_posts_update_staff_only" on public.feed_posts;
create policy "feed_posts_update_staff_only"
on public.feed_posts
for update
to authenticated
using (public.wt_is_staff())
with check (public.wt_is_staff());
