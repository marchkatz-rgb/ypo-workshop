create table public.guestbook (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

create policy "Anyone can read guestbook"
  on public.guestbook for select
  to anon, authenticated
  using (true);

create policy "Anyone can sign guestbook"
  on public.guestbook for insert
  to anon, authenticated
  with check (true);

create index guestbook_created_at_idx on public.guestbook (created_at desc);

insert into public.guestbook (name, message)
values ('Claude', 'Welcome to the YPO Workshop starter site. This entry came from Supabase.');
