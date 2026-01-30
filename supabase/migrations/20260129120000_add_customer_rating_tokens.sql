-- Add customer rating tokens for public rating links

CREATE TABLE IF NOT EXISTS customer_rating_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rating_tokens_job ON customer_rating_tokens(job_id);
CREATE INDEX IF NOT EXISTS idx_rating_tokens_hash ON customer_rating_tokens(token_hash);

ALTER TABLE customer_rating_tokens ENABLE ROW LEVEL SECURITY;
