import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

// Server-side onboarding gate — runs before any page renders (including
// client-side navigations, since the App Router's RSC fetches also pass
// through middleware), so there's no window where an unonboarded visitor
// can see or interact with the real app before a redirect fires. This
// replaces the old client-side OnboardingGate, which checked the cookie
// inside a useEffect after the real page had already painted.
export function middleware(request: NextRequest) {
  const onboarded = request.cookies.get(ONBOARDING_COOKIE)?.value === "1";
  if (!onboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip the onboarding route itself (avoid a redirect loop), API routes,
  // Next internals, and anything that looks like a static file (has a
  // dot in its last path segment — covers /images/*, favicons, etc.).
  matcher: ["/((?!onboarding|api|_next|.*\\..*).*)"],
};
