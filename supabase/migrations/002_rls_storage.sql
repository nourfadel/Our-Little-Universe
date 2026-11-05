-- Row Level Security and private storage

alter table public.profiles enable row level security;
alter table public.memories enable row level security;
alter table public.memory_media enable row level security;
alter table public.site_settings enable row level security;

-- profiles: users read only their own row. Roles are changed in SQL by the project owner.
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- memories
create policy "members read memories" on public.memories
  for select to authenticated using (public.is_member());
create policy "admins insert memories" on public.memories
  for insert to authenticated with check (public.is_admin());
create policy "admins update memories" on public.memories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete memories" on public.memories
  for delete to authenticated using (public.is_admin());

-- memory_media
create policy "members read media" on public.memory_media
  for select to authenticated using (public.is_member());
create policy "admins insert media" on public.memory_media
  for insert to authenticated with check (public.is_admin());
create policy "admins update media" on public.memory_media
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete media" on public.memory_media
  for delete to authenticated using (public.is_admin());

-- site_settings
create policy "members read settings" on public.site_settings
  for select to authenticated using (public.is_member());
create policy "admins update settings" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage: private bucket, 100 MB limit, images and videos only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memories', 'memories', false, 104857600,
  array['image/jpeg','image/png','image/webp','image/avif','image/heic','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "members read memory files" on storage.objects
  for select to authenticated using (bucket_id = 'memories' and public.is_member());
create policy "admins upload memory files" on storage.objects
  for insert to authenticated with check (bucket_id = 'memories' and public.is_admin());
create policy "admins update memory files" on storage.objects
  for update to authenticated using (bucket_id = 'memories' and public.is_admin());
create policy "admins delete memory files" on storage.objects
  for delete to authenticated using (bucket_id = 'memories' and public.is_admin());
