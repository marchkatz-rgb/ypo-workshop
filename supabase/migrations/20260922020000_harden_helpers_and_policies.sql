-- Move policy helper functions out of the public API schema so they can't be
-- called directly over REST. Policies keep working because they reference the
-- functions by identity, not by name.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.can_view_planet(uuid) set schema private;
alter function public.owns_planet(uuid) set schema private;
revoke execute on function private.can_view_planet(uuid) from public;
revoke execute on function private.owns_planet(uuid) from public;
grant execute on function private.can_view_planet(uuid) to anon, authenticated;
grant execute on function private.owns_planet(uuid) to anon, authenticated;

-- The signup trigger should never be callable over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Recreate policies with (select auth.uid()) so it is evaluated once per query.
drop policy "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy "Public planets are viewable by everyone" on public.planets;
drop policy "Users can create their own planets" on public.planets;
drop policy "Owners can update their planets" on public.planets;
drop policy "Owners can delete their planets" on public.planets;
create policy "Public planets are viewable by everyone"
  on public.planets for select to anon, authenticated
  using (is_public or owner_id = (select auth.uid()));
create policy "Users can create their own planets"
  on public.planets for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Owners can update their planets"
  on public.planets for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners can delete their planets"
  on public.planets for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy "Users can read their own mentor chats" on public.mentor_messages;
drop policy "Users can write mentor chats on their planets" on public.mentor_messages;
drop policy "Users can clear their own mentor chats" on public.mentor_messages;
create policy "Users can read their own mentor chats"
  on public.mentor_messages for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can write mentor chats on their planets"
  on public.mentor_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and private.owns_planet(planet_id));
create policy "Users can clear their own mentor chats"
  on public.mentor_messages for delete to authenticated
  using (user_id = (select auth.uid()));

-- Cover the remaining foreign keys with indexes.
create index mentor_messages_organism_id_idx on public.mentor_messages (organism_id);
create index mentor_messages_user_id_idx on public.mentor_messages (user_id);
