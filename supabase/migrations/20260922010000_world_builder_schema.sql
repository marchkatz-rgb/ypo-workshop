-- Profiles -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Planets --------------------------------------------------------------
create table public.planets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  config jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index planets_owner_id_idx on public.planets (owner_id);
alter table public.planets enable row level security;

create policy "Public planets are viewable by everyone"
  on public.planets for select to anon, authenticated
  using (is_public or owner_id = auth.uid());
create policy "Users can create their own planets"
  on public.planets for insert to authenticated
  with check (owner_id = auth.uid());
create policy "Owners can update their planets"
  on public.planets for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners can delete their planets"
  on public.planets for delete to authenticated
  using (owner_id = auth.uid());

-- Helper functions used by child-table policies --------------------------
create function public.can_view_planet(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.planets
    where id = p and (is_public or owner_id = auth.uid())
  );
$$;

create function public.owns_planet(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.planets
    where id = p and owner_id = auth.uid()
  );
$$;

-- Regions --------------------------------------------------------------
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null references public.planets(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null,
  description text not null default '' check (char_length(description) <= 2000),
  traits jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index regions_planet_id_idx on public.regions (planet_id);
alter table public.regions enable row level security;

create policy "Regions of visible planets are viewable"
  on public.regions for select to anon, authenticated
  using (public.can_view_planet(planet_id));
create policy "Owners can add regions"
  on public.regions for insert to authenticated
  with check (public.owns_planet(planet_id));
create policy "Owners can update regions"
  on public.regions for update to authenticated
  using (public.owns_planet(planet_id)) with check (public.owns_planet(planet_id));
create policy "Owners can delete regions"
  on public.regions for delete to authenticated
  using (public.owns_planet(planet_id));

-- Organisms ------------------------------------------------------------
create table public.organisms (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null references public.planets(id) on delete cascade,
  region_id uuid references public.regions(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null default 'animal',
  description text not null default '' check (char_length(description) <= 4000),
  traits jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organisms_planet_id_idx on public.organisms (planet_id);
create index organisms_region_id_idx on public.organisms (region_id);
alter table public.organisms enable row level security;

create policy "Organisms of visible planets are viewable"
  on public.organisms for select to anon, authenticated
  using (public.can_view_planet(planet_id));
create policy "Owners can add organisms"
  on public.organisms for insert to authenticated
  with check (public.owns_planet(planet_id));
create policy "Owners can update organisms"
  on public.organisms for update to authenticated
  using (public.owns_planet(planet_id)) with check (public.owns_planet(planet_id));
create policy "Owners can delete organisms"
  on public.organisms for delete to authenticated
  using (public.owns_planet(planet_id));

-- Mentor chat history ----------------------------------------------------
create table public.mentor_messages (
  id bigint generated always as identity primary key,
  planet_id uuid not null references public.planets(id) on delete cascade,
  organism_id uuid references public.organisms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);
create index mentor_messages_planet_idx on public.mentor_messages (planet_id, created_at);
alter table public.mentor_messages enable row level security;

create policy "Users can read their own mentor chats"
  on public.mentor_messages for select to authenticated
  using (user_id = auth.uid());
create policy "Users can write mentor chats on their planets"
  on public.mentor_messages for insert to authenticated
  with check (user_id = auth.uid() and public.owns_planet(planet_id));
create policy "Users can clear their own mentor chats"
  on public.mentor_messages for delete to authenticated
  using (user_id = auth.uid());

-- updated_at maintenance -------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger planets_set_updated_at
  before update on public.planets
  for each row execute procedure public.set_updated_at();
create trigger organisms_set_updated_at
  before update on public.organisms
  for each row execute procedure public.set_updated_at();
