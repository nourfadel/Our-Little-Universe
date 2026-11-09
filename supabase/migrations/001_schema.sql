-- Our Little Universe: core schema
create extension if not exists pgcrypto;

-- Roles ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- Every new auth user becomes a 'viewer'. Promote admins manually (see README).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Shared helpers ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Memories ---------------------------------------------------------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  caption text,
  memory_date date not null,
  cover_media_id uuid,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  file_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'audio')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.memories
  add constraint memories_cover_media_fk
  foreign key (cover_media_id) references public.memory_media (id) on delete set null;

-- A cover must belong to its own memory.
create or replace function public.check_cover_belongs()
returns trigger language plpgsql as $$
begin
  if new.cover_media_id is not null and not exists (
    select 1 from public.memory_media where id = new.cover_media_id and memory_id = new.id
  ) then
    raise exception 'cover_media_id must reference media of the same memory';
  end if;
  return new;
end $$;

create trigger memories_cover_check
  before insert or update of cover_media_id on public.memories
  for each row execute function public.check_cover_belongs();

create trigger memories_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- Only one featured memory, enforced by the database.
create unique index memories_single_featured on public.memories (is_featured) where is_featured;

create index memories_date_idx on public.memories (memory_date desc);
create index memory_media_memory_idx on public.memory_media (memory_id, sort_order);
create unique index memory_media_path_idx on public.memory_media (file_path);

-- Atomic swap of the featured memory (pass null to clear).
create or replace function public.set_featured_memory(p_id uuid)
returns void language plpgsql security invoker as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.memories set is_featured = false where is_featured and id is distinct from p_id;
  if p_id is not null then
    update public.memories set is_featured = true where id = p_id;
  end if;
end $$;

-- Site settings (single row) --------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  landing_message text not null default 'ملقتش ونس للعمر أحسن منك',
  button_label text not null default 'US',
  initials text not null default 'A & A',
  relationship_start_date date,
  counter_label text not null default 'We''ve been together for',
  counter_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create unique index site_settings_singleton on public.site_settings ((true));

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings default values;
