-- Configure role-based permissions for Entretien Prestige
-- This defines what each role can access in the application

UPDATE companies
SET role_permissions = '{
  "admin": {
    "dashboard": true,
    "jobs": true,
    "customers": true,
    "team": true,
    "reports": true,
    "settings": true,
    "billing": true,
    "products": true,
    "schedule": true,
    "documents": true,
    "create_user": true,
    "edit_user": true,
    "delete_user": true,
    "view_all_jobs": true,
    "create_job": true,
    "edit_job": true,
    "delete_job": true,
    "view_financials": true,
    "manage_company": true
  },
  "manager": {
    "dashboard": true,
    "jobs": true,
    "customers": true,
    "team": true,
    "reports": true,
    "settings": false,
    "billing": true,
    "products": true,
    "schedule": true,
    "documents": true,
    "create_user": false,
    "edit_user": false,
    "delete_user": false,
    "view_all_jobs": true,
    "create_job": true,
    "edit_job": true,
    "delete_job": true,
    "view_financials": true,
    "manage_company": false
  },
  "dispatcher": {
    "dashboard": true,
    "jobs": true,
    "customers": true,
    "team": true,
    "reports": false,
    "settings": false,
    "billing": false,
    "products": true,
    "schedule": true,
    "documents": true,
    "create_user": false,
    "edit_user": false,
    "delete_user": false,
    "view_all_jobs": true,
    "create_job": true,
    "edit_job": true,
    "delete_job": false,
    "view_financials": false,
    "manage_company": false
  },
  "sales_rep": {
    "dashboard": true,
    "jobs": true,
    "customers": true,
    "team": false,
    "reports": false,
    "settings": false,
    "billing": false,
    "products": true,
    "schedule": true,
    "documents": true,
    "create_user": false,
    "edit_user": false,
    "delete_user": false,
    "view_all_jobs": false,
    "create_job": true,
    "edit_job": false,
    "delete_job": false,
    "view_financials": false,
    "manage_company": false
  },
  "technician": {
    "dashboard": true,
    "jobs": true,
    "customers": false,
    "team": false,
    "reports": false,
    "settings": false,
    "billing": false,
    "products": false,
    "schedule": true,
    "documents": false,
    "create_user": false,
    "edit_user": false,
    "delete_user": false,
    "view_all_jobs": false,
    "create_job": false,
    "edit_job": false,
    "delete_job": false,
    "view_financials": false,
    "manage_company": false
  }
}'::jsonb
WHERE name = 'Entretien Prestige';

-- Verify the configuration
SELECT
  company_id,
  name,
  role_permissions
FROM companies
WHERE name = 'Entretien Prestige';
