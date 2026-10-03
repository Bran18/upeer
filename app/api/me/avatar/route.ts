import { NextResponse } from 'next/server';
import { resolveSession } from '@/lib/auth/resolve-session';
import { getMeProfile, updateProfileAvatarUrl } from '@/lib/db/profiles';
import {
  avatarExtensionForMime,
  AVATAR_MAX_BYTES,
  isAllowedAvatarMime,
} from '@/lib/profile/avatar';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await resolveSession(request);
  if (!session?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
  }

  if (!isAllowedAvatarMime(file.type)) {
    return NextResponse.json(
      { error: 'Use a JPEG, PNG, WebP, or GIF image' },
      { status: 400 },
    );
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image must be 2 MB or smaller' },
      { status: 400 },
    );
  }

  const profileId = session.profileId;
  const ext = avatarExtensionForMime(file.type);
  const objectPath = `${profileId}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrl } = supabase.storage
    .from('avatars')
    .getPublicUrl(objectPath);

  await updateProfileAvatarUrl(profileId, publicUrl.publicUrl);
  const profile = await getMeProfile(profileId);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile, avatarUrl: publicUrl.publicUrl });
}

export async function DELETE(request: Request) {
  const session = await resolveSession(request);
  if (!session?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  await updateProfileAvatarUrl(session.profileId, null);
  const profile = await getMeProfile(session.profileId);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
