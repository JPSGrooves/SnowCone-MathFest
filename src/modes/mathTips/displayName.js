// /src/modes/mathTips/displayName.js
// Return a friendly display name.
// If profile.username is missing or "guest", fall back to "friend".
export function displayName(appStateLike) {
  const raw = appStateLike?.profile?.username;
  if (!raw) return 'friend';
  const s = String(raw).trim();
  if (!s) return 'friend';
  if (s.toLowerCase() === 'guest') return 'friend';
  return s;
}
