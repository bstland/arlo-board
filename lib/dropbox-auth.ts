// Server-side only — Dropbox authentication
// For v1, we use a long-lived access token directly.
// Future: implement refresh token flow.

export async function getAccessToken(): Promise<string> {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('DROPBOX_ACCESS_TOKEN is not configured');
  }
  return token;
}
