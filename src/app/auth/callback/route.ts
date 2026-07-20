import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where Supabase/Google send the browser back to after
// signInWithOAuth() — exchanges the one-time `code` for a real session
// (writing the session cookies via the server client's cookie adapter),
// then redirects on to wherever the sign-in was meant to land.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing/invalid code, or the exchange itself failed — back to the
  // sign-in screen with a flag it can show a "something went wrong,
  // try again" message for, rather than silently landing in the app
  // signed out with no explanation.
  return NextResponse.redirect(`${origin}/signin?error=1`);
}

// Only ever allow redirecting back into this same app — `next` comes
// from a query param on a URL an external provider (Google/Supabase)
// redirects the browser to, so it must never be trusted as-is. A value
// like "//evil.example.com" or "https://evil.example.com" would still
// pass a naive `startsWith("/")` check (browsers treat a leading "//" as
// a protocol-relative URL to a different host) — rejecting anything
// with "//" anywhere, not just requiring a single leading slash, closes
// that gap. Falls back to /gallery, the requested default landing spot.
function safeInternalPath(next: string | null): string {
  if (!next) return "/gallery";
  if (!next.startsWith("/")) return "/gallery";
  if (next.startsWith("//")) return "/gallery";
  if (next.includes("://")) return "/gallery";
  return next;
}
