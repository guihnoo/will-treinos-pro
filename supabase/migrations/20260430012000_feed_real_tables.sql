create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_avatar text not null,
  author_role text not null default 'aluno',
  content text not null default '',
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_post_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index if not exists feed_post_comments_post_idx on public.feed_post_comments (post_id, created_at desc);
create index if not exists feed_post_likes_post_idx on public.feed_post_likes (post_id);

alter table public.feed_posts enable row level security;
alter table public.feed_post_likes enable row level security;
alter table public.feed_post_comments enable row level security;

drop policy if exists "feed_posts_select_authenticated" on public.feed_posts;
create policy "feed_posts_select_authenticated"
on public.feed_posts
for select
to authenticated
using (true);

drop policy if exists "feed_posts_insert_authenticated" on public.feed_posts;
create policy "feed_posts_insert_authenticated"
on public.feed_posts
for insert
to authenticated
with check (true);

drop policy if exists "feed_post_likes_select_authenticated" on public.feed_post_likes;
create policy "feed_post_likes_select_authenticated"
on public.feed_post_likes
for select
to authenticated
using (true);

drop policy if exists "feed_post_likes_insert_own" on public.feed_post_likes;
create policy "feed_post_likes_insert_own"
on public.feed_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "feed_post_likes_delete_own" on public.feed_post_likes;
create policy "feed_post_likes_delete_own"
on public.feed_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "feed_post_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_select_authenticated"
on public.feed_post_comments
for select
to authenticated
using (true);

drop policy if exists "feed_post_comments_insert_own" on public.feed_post_comments;
create policy "feed_post_comments_insert_own"
on public.feed_post_comments
for insert
to authenticated
with check (auth.uid() = user_id);
