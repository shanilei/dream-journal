-- Enables Row Level Security on dreams and adds ownership policies,
-- explicitly scoped to the `authenticated` role only — the anon role
-- matches no policy for any of these commands, so unauthenticated
-- requests get zero rows / a rejected write, not an error that leaks
-- whether a row exists.
--
-- This is defense-in-depth on top of the app-level user_id filtering
-- already deployed (dreams-store.ts) — not the first place ownership is
-- enforced, a second, database-level guarantee that holds even if the
-- application layer ever has a bug.

ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_dreams" ON dreams
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert_own_dreams" ON dreams
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_dreams" ON dreams
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_dreams" ON dreams
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
