import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

// Session-refresh mechanism, required by @supabase/ssr's Next.js App
// Router pattern: Server Components can't write cookies, so without this
// running in middleware on every request, an expiring session's refreshed
// token would never actually get persisted back to the browser. This
// does not gate/redirect anything by itself — the auth redirect lives in
// middleware.ts, using the `user` this returns — so it's safe to run
// unconditionally before any of middleware.ts's own routing logic.
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // These are new as of Phase 1 and may not be set in every environment
  // yet (e.g. production, until they're added there) — this runs on
  // nearly every request via middleware.ts, so failing hard here would
  // take down the whole app rather than just auth. Skip refreshing
  // (identical to today's no-auth behavior) instead of throwing.
  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session if it's expired — required so Server
  // Components (which can only read cookies, not write them) always see
  // an up-to-date session. Also doubles as the auth check middleware.ts
  // uses to decide whether to redirect to /signin, so both concerns share
  // this one request to Supabase instead of checking twice.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
