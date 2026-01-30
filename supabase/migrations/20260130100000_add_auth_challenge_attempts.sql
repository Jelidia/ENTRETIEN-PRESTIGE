ALTER TABLE auth_challenges
ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0;
