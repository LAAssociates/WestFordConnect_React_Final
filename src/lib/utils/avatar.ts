export const optimizeAvatarUrl = (url?: string | null, size: number = 96): string | undefined => {
  if (!url) return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const targetSize = Math.max(32, Math.min(512, Math.round(size)));

    // Google profile photos: force stable square thumbnail size.
    if (host.includes("googleusercontent.com")) {
      const current = parsed.toString();

      // Common Google avatar format:
      // https://.../a/<id>=s96-c
      if (/=s\d+(-[a-z0-9]+)?$/i.test(current)) {
        return current.replace(/=s\d+(-[a-z0-9]+)?$/i, `=s${targetSize}-c`);
      }

      // Fallback for other googleusercontent image formats.
      return `${current}=s${targetSize}-c`;
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
};
