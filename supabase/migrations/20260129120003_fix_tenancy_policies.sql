-- Ensure tenant isolation policies for non-company tables

ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communication ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_review_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_rework ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_challenges_owner_read ON auth_challenges;
CREATE POLICY auth_challenges_owner_read ON auth_challenges
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS auth_challenges_owner_insert ON auth_challenges;
CREATE POLICY auth_challenges_owner_insert ON auth_challenges
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS auth_challenges_owner_update ON auth_challenges;
CREATE POLICY auth_challenges_owner_update ON auth_challenges
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS comm_company_read ON customer_communication;
CREATE POLICY comm_company_read ON customer_communication
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.customer_id = customer_communication.customer_id
        AND customers.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS comm_company_write ON customer_communication;
CREATE POLICY comm_company_write ON customer_communication
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.customer_id = customer_communication.customer_id
        AND customers.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS ratings_company_read ON customer_ratings;
CREATE POLICY ratings_company_read ON customer_ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = customer_ratings.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS ratings_company_write ON customer_ratings;
CREATE POLICY ratings_company_write ON customer_ratings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = customer_ratings.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS subscriptions_company_read ON customer_subscriptions;
CREATE POLICY subscriptions_company_read ON customer_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = customer_subscriptions.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS subscriptions_company_write ON customer_subscriptions;
CREATE POLICY subscriptions_company_write ON customer_subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = customer_subscriptions.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS availability_own_or_manager ON employee_availability;
CREATE POLICY availability_own_or_manager ON employee_availability
  USING (
    user_id = auth.uid()
    OR public.is_manager_or_admin()
  );

DROP POLICY IF EXISTS availability_own_or_manager_insert ON employee_availability;
CREATE POLICY availability_own_or_manager_insert ON employee_availability
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_manager_or_admin()
  );

DROP POLICY IF EXISTS bonuses_company_isolation ON google_review_bonuses;
CREATE POLICY bonuses_company_isolation ON google_review_bonuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = google_review_bonuses.technician_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS bonuses_company_write ON google_review_bonuses;
CREATE POLICY bonuses_company_write ON google_review_bonuses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = google_review_bonuses.technician_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS assignments_company_read ON job_assignments;
CREATE POLICY assignments_company_read ON job_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.job_id = job_assignments.job_id
        AND jobs.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS assignments_company_write ON job_assignments;
CREATE POLICY assignments_company_write ON job_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.job_id = job_assignments.job_id
        AND jobs.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS history_company_read ON job_history;
CREATE POLICY history_company_read ON job_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.job_id = job_history.job_id
        AND jobs.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS history_company_write ON job_history;
CREATE POLICY history_company_write ON job_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.job_id = job_history.job_id
        AND jobs.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_photos_company_isolation ON job_photos;
CREATE POLICY job_photos_company_isolation ON job_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_photos.job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_photos_company_write ON job_photos;
CREATE POLICY job_photos_company_write ON job_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_photos.job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS rework_company_isolation ON job_rework;
CREATE POLICY rework_company_isolation ON job_rework
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_rework.original_job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS rework_company_write ON job_rework;
CREATE POLICY rework_company_write ON job_rework
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_rework.original_job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_upsells_company_read ON job_upsells;
CREATE POLICY job_upsells_company_read ON job_upsells
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_upsells.job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_upsells_company_write ON job_upsells;
CREATE POLICY job_upsells_company_write ON job_upsells
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.job_id = job_upsells.job_id
        AND j.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS loyalty_points_company_read ON loyalty_points;
CREATE POLICY loyalty_points_company_read ON loyalty_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = loyalty_points.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS loyalty_points_company_write ON loyalty_points;
CREATE POLICY loyalty_points_company_write ON loyalty_points
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = loyalty_points.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS loyalty_transactions_company_read ON loyalty_transactions;
CREATE POLICY loyalty_transactions_company_read ON loyalty_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = loyalty_transactions.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS loyalty_transactions_company_write ON loyalty_transactions;
CREATE POLICY loyalty_transactions_company_write ON loyalty_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = loyalty_transactions.customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS onboarding_company_read ON onboarding_progress;
CREATE POLICY onboarding_company_read ON onboarding_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = onboarding_progress.user_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS onboarding_company_write ON onboarding_progress;
CREATE POLICY onboarding_company_write ON onboarding_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = onboarding_progress.user_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS referrals_company_read ON referrals;
CREATE POLICY referrals_company_read ON referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = referrals.referrer_customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS referrals_company_write ON referrals;
CREATE POLICY referrals_company_write ON referrals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.customer_id = referrals.referrer_customer_id
        AND c.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS termination_company_read ON termination_records;
CREATE POLICY termination_company_read ON termination_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = termination_records.user_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS termination_company_write ON termination_records;
CREATE POLICY termination_company_write ON termination_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = termination_records.user_id
        AND u.company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS audit_owner_read ON user_audit_log;
CREATE POLICY audit_owner_read ON user_audit_log
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users AS admin_user
      WHERE admin_user.user_id = auth.uid()
        AND admin_user.role = 'admin'
        AND admin_user.company_id = (SELECT company_id FROM users WHERE user_id = user_audit_log.user_id)
    )
  );

DROP POLICY IF EXISTS audit_owner_write ON user_audit_log;
CREATE POLICY audit_owner_write ON user_audit_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS sessions_owner_read ON user_sessions;
CREATE POLICY sessions_owner_read ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS sessions_owner_write ON user_sessions;
CREATE POLICY sessions_owner_write ON user_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS sessions_owner_update ON user_sessions;
CREATE POLICY sessions_owner_update ON user_sessions
  FOR UPDATE
  USING (user_id = auth.uid());
