// One-year cookie, readable server-side (via next/headers cookies() in the
// root page) so the very first response can redirect straight to
// /onboarding for a new visitor — sessionStorage alone can't do that,
// since it's only readable after the client has already hydrated
// whatever page the server first rendered.
export const ONBOARDING_COOKIE = "dj_onboarded";

export function markOnboarded() {
  try {
    document.cookie = `${ONBOARDING_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore — worst case the user sees onboarding again next visit
  }
}
