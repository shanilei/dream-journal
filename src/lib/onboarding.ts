// One-year cookie, readable server-side (via next/headers cookies() in
// middleware/the root page) so the very first response can redirect
// straight to /onboarding for a new visitor — sessionStorage alone can't
// do that, since it's only readable after the client has already
// hydrated whatever page the server first rendered.
export const ONBOARDING_COOKIE = "dj_onboarded";
export const ONBOARDING_SESSION_KEY = "dj_onboarded";

export function markOnboarded() {
  try {
    document.cookie = `${ONBOARDING_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore — worst case the user sees onboarding again next visit
  }
}

// Dev/QA-only: clears the cookie (+ its sessionStorage fallback) so the
// next navigation is treated as a first-time visit again. Exposed via a
// "Reset onboarding" row in Settings, gated to non-production builds.
export function clearOnboarded() {
  try {
    document.cookie = `${ONBOARDING_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    sessionStorage.removeItem(ONBOARDING_SESSION_KEY);
  } catch {
    // ignore
  }
}
