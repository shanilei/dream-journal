import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Server-side "who is signed in" check — for Server Components, Route
// Handlers, and Server Actions.
//
// Deliberately calls getUser(), never getSession(): getSession() only
// reads whatever the session cookie *claims*, without checking it against
// Supabase's auth server, so a forged/stale cookie would be trusted as-is.
// getUser() always re-validates against Supabase itself, which is the
// only version of this check that's safe to make any access-control
// decision on. Nothing in the app enforces access based on this yet
// (Phase 2 is authentication only, no route gating) — this exists so
// that whenever gating is added, there's already a single, correct
// primitive to build it on.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// For Server Components on personal-journal routes. Middleware already
// redirects signed-out visitors to /signin before these ever render —
// this is a second, independent check (defense in depth, and the only
// way the component actually gets the user's id to scope its query by),
// not the primary gate.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}
