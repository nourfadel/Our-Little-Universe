-- Allow voice recordings to be attached to existing memories.
alter table public.memory_media
  drop constraint if exists memory_media_media_type_check;

alter table public.memory_media
  add constraint memory_media_media_type_check
  check (media_type in ('image', 'video', 'audio'));

-- Keep the existing private bucket and size limit while allowing common audio formats.
update storage.buckets
set file_size_limit = 104857600,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav',
      'audio/webm', 'audio/ogg', 'audio/aac'
    ]
where id = 'memories';
