import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ADMIN-ONLY CLIENT — uses the service-role key, which bypasses Row Level
// Security entirely. This must never be imported into a Client Component
// and must never be used as a stand-in for the signed-in user's own
// client (see src/lib/supabase/server.ts for that).
//
// Deliberately NOT guarded with the `server-only` package here: that
// package throws unconditionally outside Next's own bundler (it only
// no-ops under the "react-server" export condition Next sets), and
// src/seed-dream.ts imports this client while running as a plain
// standalone script (via tsx/ts-node, not through Next's build) — adding
// that guard would break the seed script. Every current importer
// (dreams-store.ts, the API routes, seed-dream.ts) is already
// server-only in practice; this is a naming/isolation change, not a new
// runtime enforcement mechanism.
//
// This client predates per-user auth (see the Phase 1 auth-infrastructure
// audit) and every existing dream read/write still goes through it today
// — that hasn't changed in this pass. It stays around until the dreams
// queries themselves are migrated to the request-scoped user client in a
// later phase; at that point most of its current call sites should move
// off of it, and only genuinely admin-only operations (if any) should
// keep using it.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    _client = createClient(url, key);
  }
  return _client;
}
