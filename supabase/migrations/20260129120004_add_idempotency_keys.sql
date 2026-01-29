-- Add idempotency keys for mutation endpoints

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  scope text not null,
  request_hash text not null,
  response_status int,
  response_body jsonb,
  status text check (status in ('processing', 'completed')) default 'processing',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key_scope
  ON idempotency_keys(idempotency_key, scope);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS idempotency_owner_read ON idempotency_keys;
CREATE POLICY idempotency_owner_read ON idempotency_keys
  FOR SELECT
  USING (scope = CONCAT('user:', auth.uid()::text));

DROP POLICY IF EXISTS idempotency_owner_write ON idempotency_keys;
CREATE POLICY idempotency_owner_write ON idempotency_keys
  FOR INSERT
  WITH CHECK (scope = CONCAT('user:', auth.uid()::text));

DROP POLICY IF EXISTS idempotency_owner_update ON idempotency_keys;
CREATE POLICY idempotency_owner_update ON idempotency_keys
  FOR UPDATE
  USING (scope = CONCAT('user:', auth.uid()::text));
