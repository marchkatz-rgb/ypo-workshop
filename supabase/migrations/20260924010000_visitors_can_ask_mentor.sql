-- Any signed-in user may keep a private mentor conversation about a planet they can view.
drop policy "Users can write mentor chats on their planets" on public.mentor_messages;
create policy "Users can write mentor chats on planets they can view"
  on public.mentor_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_view_planet(planet_id));
