import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Request-scoped server Supabase client — for use in Server Components,
// Route Handlers, and Server Actions. Uses only the public anon key plus
// the current request's cookies, so it acts as *the signed-in user*
// (once auth exists), never with elevated privilege. This is the client
// that should eventually replace the admin client (src/supabase-admin.ts)
// for every dream read/write — not yet done in this phase.
//
// `cookies()` is async in this Next.js version, so this factory is async
// too; call it as `const supabase = await createClient()` at each call
// site.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // `setAll` was called from a Server Component, which can't
            // write cookies directly — safe to ignore here because the
            // middleware session-refresh (see src/lib/supabase/middleware.ts)
            // is what actually keeps the session cookie fresh across
            // requests; this client only needs to *read* it in that case.
          }
        },
      },
    }
  );
}
