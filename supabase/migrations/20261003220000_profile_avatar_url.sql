-- Public profile photo URL (Supabase Storage or external HTTPS).

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'HTTPS URL to a profile image shown in nav and marketplace.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
