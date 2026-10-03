const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function isAllowedAvatarMime(type: string): boolean {
  return ALLOWED_AVATAR_TYPES.has(type);
}

export function avatarExtensionForMime(type: string): string {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}
