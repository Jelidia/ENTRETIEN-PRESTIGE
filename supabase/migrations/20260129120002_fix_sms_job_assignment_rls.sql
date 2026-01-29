-- Add insert/update RLS policies for sms_messages and job_assignments

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sms_company_write ON sms_messages;
CREATE POLICY sms_company_write ON sms_messages
  FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS sms_company_update ON sms_messages;
CREATE POLICY sms_company_update ON sms_messages
  FOR UPDATE
  USING (company_id = (SELECT company_id FROM users WHERE user_id = auth.uid()));

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
