-- Allow admin and manager to read all users in their company
CREATE POLICY "users_read_company_admin_manager" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.company_id = users.company_id
        AND u.role IN ('admin', 'manager')
    )
  );
