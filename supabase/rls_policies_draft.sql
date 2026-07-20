-- ============================================================================
-- DRAFT — FOR REVIEW ONLY. DO NOT RUN YET.
-- ============================================================================
-- Not named with a timestamp prefix (unlike everything in
-- supabase/migrations/) so it can't be mistaken for an applied/ready-to-run
-- migration or picked up by tooling that walks that directory in order.
--
-- Apply only after the authenticated application flow (Phase 3) has been
-- verified working end-to-end with app-level user_id filtering — RLS here
-- is meant as defense-in-depth on top of that, not a replacement for it,
-- and should never be the first time ownership is actually enforced.
-- ============================================================================

ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_dreams" ON dreams
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "insert_own_dreams" ON dreams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_dreams" ON dreams
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_dreams" ON dreams
  FOR DELETE
  USING (user_id = auth.uid());

-- Not addressed here (separate, later decisions per the Phase 1 audit):
-- - No policy for user_id IS NULL rows (there shouldn't be any after the
--   Phase "ownership migration" backfill — if any exist, they become
--   invisible to everyone once this is enabled, which is probably what
--   you want, but worth double-checking count is 0 immediately before
--   running this).
-- - No exhibition/kiosk-account carve-out yet.
-- - Storage bucket policies are untouched by this file entirely.
