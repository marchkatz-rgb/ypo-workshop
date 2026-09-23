-- Public bucket for creature drawings. Files are stored under <planet_id>/<organism_id>/<name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('organism-art', 'organism-art', true, 6291456, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Anyone can view organism art"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'organism-art');

create policy "Planet owners can upload organism art"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'organism-art'
    and private.owns_planet(((storage.foldername(name))[1])::uuid)
  );

create policy "Planet owners can replace organism art"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'organism-art'
    and private.owns_planet(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'organism-art'
    and private.owns_planet(((storage.foldername(name))[1])::uuid)
  );

create policy "Planet owners can delete organism art"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'organism-art'
    and private.owns_planet(((storage.foldername(name))[1])::uuid)
  );
