-- Enable RLS and policies for core tables missing RLS

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_location_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_company_read ON companies;
CREATE POLICY companies_company_read ON companies
  FOR SELECT
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS companies_company_write ON companies;
CREATE POLICY companies_company_write ON companies
  FOR UPDATE
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

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

DROP POLICY IF EXISTS tech_daily_company_read ON technician_location_daily;
CREATE POLICY tech_daily_company_read ON technician_location_daily
  FOR SELECT
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS tech_daily_company_write ON technician_location_daily;
CREATE POLICY tech_daily_company_write ON technician_location_daily
  FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));
