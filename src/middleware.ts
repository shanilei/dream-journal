import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";
import { updateSession } from "@/lib/supabase/middleware";

// Server-side onboarding gate — runs before any page renders (including
// client-side navigations, since the App Router's RSC fetches also pass
// through middleware), so there's no window where an unonboarded visitor
// can see or interact with the real app before a redirect fires. This
// replaces the old client-side OnboardingGate, which checked the cookie
// inside a useEffect after the real page had already painted.
//
// updateSession() (Phase 1 auth infrastructure) runs first on every
// request to keep Supabase session cookies refreshed — it doesn't
// redirect or gate anything by itself, so the onboarding check below is
// completely unchanged; its response is just the base we build the
// onboarding redirect on top of (carrying over any refreshed auth
// cookies) instead of a fresh NextResponse. No auth gating exists yet.
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const onboarded = request.cookies.get(ONBOARDING_COOKIE)?.value === "1";
  if (!onboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}

export const config = {
  // Skip the onboarding route itself (avoid a redirect loop), API routes,
  // Next internals, and anything that looks like a static file (has a
  // dot in its last path segment — covers /images/*, favicons, etc.).
  //
  // "auth" is also skipped (added for Phase 2's Google sign-in): Google/
  // Supabase redirect the browser straight to /auth/callback?code=... to
  // finish a sign-in, at any point, regardless of whether this browser
  // has ever completed onboarding — if that request got caught by the
  // onboarding redirect above instead of reaching the callback route
  // handler, the OAuth code would never get exchanged and sign-in would
  // silently fail. /signin itself is intentionally NOT in this list, so
  // it still goes through the normal onboarding gate like every other
  // screen.
  matcher: ["/((?!onboarding|auth|api|_next|.*\\..*).*)"],
};
