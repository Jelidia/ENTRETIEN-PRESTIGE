-- Drop the problematic policy with infinite recursion
DROP POLICY IF EXISTS "users_read_company_admin_manager" ON public.users;

-- Create helper function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid();
$$;

-- Create helper function to get user company_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM public.users WHERE user_id = auth.uid();
$$;

-- Create new policy without recursion
CREATE POLICY "users_read_company_admin_manager" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- Admin and manager can see all users in their company
    (get_user_role() IN ('admin', 'manager') AND company_id = get_user_company_id())
  );
