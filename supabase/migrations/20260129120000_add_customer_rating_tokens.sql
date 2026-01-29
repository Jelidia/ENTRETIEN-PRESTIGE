-- Add customer rating tokens for public rating links

CREATE TABLE IF NOT EXISTS customer_rating_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rating_tokens_job ON customer_rating_tokens(job_id);
CREATE INDEX IF NOT EXISTS idx_rating_tokens_token ON customer_rating_tokens(token);

ALTER TABLE customer_rating_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rating_tokens_public_read ON customer_rating_tokens;
CREATE POLICY rating_tokens_public_read ON customer_rating_tokens
  FOR SELECT USING (true);

DROP POLICY IF EXISTS rating_tokens_public_update ON customer_rating_tokens;
CREATE POLICY rating_tokens_public_update ON customer_rating_tokens
  FOR UPDATE USING (used_at IS NULL);
