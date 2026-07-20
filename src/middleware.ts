import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";
import { updateSession } from "@/lib/supabase/middleware";

// Server-side onboarding + auth gate — runs before any page renders
// (including client-side navigations, since the App Router's RSC fetches
// also pass through middleware), so there's no window where an
// unonboarded or signed-out visitor can see or interact with the real
// app before a redirect fires.
//
// Two independent checks, in order:
// 1. Onboarding (unchanged from before) — redirects to /onboarding.
// 2. Auth — redirects to /signin, using the same updateSession() call's
//    `user` result (no extra request to Supabase). /signin itself is
//    exempt from this check (it's the only way a signed-out visitor
//    could ever reach a signed-in-only page otherwise, which is exactly
//    the redirect loop this avoids) — everything else this matcher
//    covers is a personal-journal route.
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const onboarded = request.cookies.get(ONBOARDING_COOKIE)?.value === "1";
  if (!onboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && request.nextUrl.pathname !== "/signin") {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
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
  // "auth" is also skipped: Google/Supabase redirect the browser straight
  // to /auth/callback?code=... to finish a sign-in, at any point,
  // regardless of onboarding/auth state — if that request got caught by
  // either redirect above instead of reaching the callback route handler,
  // the OAuth code would never get exchanged and sign-in would silently
  // fail. /signin itself is intentionally NOT in this list, so it still
  // goes through the onboarding gate like every other screen; it's
  // exempted from the *auth* gate specifically inside the function above.
  matcher: ["/((?!onboarding|auth|api|_next|.*\\..*).*)"],
};
