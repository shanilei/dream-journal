-- Backs the Exhibition Mode "Scan to keep your dream" QR handoff — a
-- public, read-only, expiring link to a single dream, addressed by a
-- random token rather than the dream's own id.
--
-- RLS is enabled with *no* policies at all (not even for `authenticated`)
-- — this table is only ever read/written via the service-role admin
-- client from trusted server routes (see src/dream-shares.ts), never
-- through a request-scoped user client or directly from the browser, so
-- there's nothing for anon/authenticated policies to safely allow here.
CREATE TABLE dream_shares (
  token text PRIMARY KEY,
  dream_id uuid NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Looking up "is there already a live share for this dream" (so repeat
-- taps of Scan reuse one token instead of piling up new rows) filters by
-- dream_id — without this index that's a full table scan.
CREATE INDEX dream_shares_dream_id_idx ON dream_shares (dream_id);

ALTER TABLE dream_shares ENABLE ROW LEVEL SECURITY;
