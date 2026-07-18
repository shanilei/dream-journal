"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client — used from Client Components. Uses only the
// public anon key (never the service-role key), so it's safe to bundle
// into client-side JS. Once Row Level Security is enabled (a later
// phase), this client's access is scoped by the signed-in user's own
// session/JWT, not by any elevated privilege.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
