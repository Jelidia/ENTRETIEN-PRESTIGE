create extension if not exists "pgcrypto";

create table companies (
  company_id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  timezone text default 'America/Montreal',
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  settings jsonb,
  role_permissions jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table users (
  user_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  email text unique not null,
  email_verified boolean default false,
  phone text unique,
  phone_verified boolean default false,
  full_name text not null,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  avatar_url text,
  role text check (role in ('admin', 'manager', 'sales_rep', 'technician', 'customer', 'dispatcher')),
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  last_login timestamptz,
  login_count int default 0,
  failed_login_attempts int default 0,
  last_failed_login timestamptz,
  two_factor_enabled boolean default true,
  two_factor_method text check (two_factor_method in ('sms', 'authenticator')) default 'sms',
  two_factor_secret text,
  password_last_changed timestamptz,
  password_expiry timestamptz,
  department text,
  manager_id uuid references users(user_id),
  hire_date date,
  employee_id text,
  notification_settings jsonb,
  access_permissions jsonb,
  id_document_front_url text,
  id_document_back_url text,
  contract_document_url text,
  contract_signature_url text,
  contract_signed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table auth_challenges (
  challenge_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  method text check (method in ('sms', 'authenticator')),
  code_hash text not null,
  session_payload text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);

create table user_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  ip_address inet,
  user_agent text,
  device_type text check (device_type in ('web', 'mobile_ios', 'mobile_android')),
  token_hash text,
  expires_at timestamptz,
  last_activity timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table user_audit_log (
  audit_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id),
  action text,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  status text check (status in ('success', 'failed', 'denied')) default 'success',
  reason text,
  created_at timestamptz default now()
);

create table customers (
  customer_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  alternate_phone text,
  address text,
  city text,
  province text,
  postal_code text,
  country text default 'CA',
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  customer_type text check (customer_type in ('residential', 'commercial', 'industrial')) default 'residential',
  company_name text,
  total_spent numeric(12, 2) default 0,
  account_balance numeric(10, 2) default 0,
  credit_limit numeric(10, 2) default 0,
  preferred_payment_method text check (preferred_payment_method in ('interac', 'credit_card', 'cash')) default 'interac',
  status text check (status in ('active', 'inactive', 'prospect', 'archived')) default 'active',
  customer_source text,
  referring_customer_id uuid references customers(customer_id),
  assigned_sales_rep_id uuid references users(user_id),
  sms_opt_in boolean default true,
  email_opt_in boolean default true,
  marketing_opt_in boolean default true,
  preferred_contact_method text check (preferred_contact_method in ('sms', 'email', 'phone', 'in_app')) default 'sms',
  first_job_date date,
  last_service_date date,
  total_jobs int default 0,
  average_rating numeric(3, 2),
  gdpr_consent boolean default false,
  terms_accepted boolean default false,
  terms_accepted_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table customer_blacklist (
  blacklist_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id),
  company_id uuid references companies(company_id),
  reason text check (reason in ('non_payment', 'dispute', 'difficult_customer', 'fraud', 'other')),
  description text,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')) default 'medium',
  recommended_action text,
  date_added timestamptz,
  added_by uuid references users(user_id),
  last_incident timestamptz,
  incident_count int default 1,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table customer_communication (
  comm_id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(customer_id),
  communication_type text check (communication_type in ('sms', 'email', 'phone_call', 'in_app_msg', 'visit')),
  subject text,
  content text,
  direction text check (direction in ('inbound', 'outbound')),
  sent_by uuid references users(user_id),
  sent_at timestamptz,
  read_at timestamptz,
  delivery_status text check (delivery_status in ('pending', 'sent', 'delivered', 'failed')) default 'pending',
  related_job_id uuid,
  attachments jsonb,
  created_at timestamptz default now()
);


create table jobs (
  job_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  sales_rep_id uuid references users(user_id),
  technician_id uuid references users(user_id),
  manager_id uuid references users(user_id),
  service_type text,
  service_package text check (service_package in ('basique', 'premium', 'prestige')),
  description text,
  scheduled_date date,
  scheduled_start_time time,
  scheduled_end_time time,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  duration_minutes int,
  address text,
  city text,
  postal_code text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  status text check (status in ('created', 'quoted', 'confirmed', 'dispatched', 'in_progress', 'completed', 'invoiced', 'paid', 'cancelled', 'rescheduled', 'no_show')) default 'created',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  estimated_revenue numeric(10, 2),
  actual_revenue numeric(10, 2),
  discount_percentage numeric(5, 2) default 0,
  discount_reason text,
  discount_approved_by uuid references users(user_id),
  discount_approved_at timestamptz,
  upsells jsonb,
  quality_issue boolean default false,
  quality_notes text,
  customer_notes text,
  technician_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(user_id),
  updated_by uuid references users(user_id),
  deleted_at timestamptz
);

create table customer_rating_tokens (
  token_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table job_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id),
  technician_id uuid references users(user_id),
  assigned_at timestamptz,
  assigned_by uuid references users(user_id),
  previous_technician_id uuid references users(user_id),
  reassignment_reason text,
  reassignment_count int default 1,
  created_at timestamptz default now()
);

create table job_history (
  history_id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(job_id),
  field_name text,
  old_value text,
  new_value text,
  changed_by uuid references users(user_id),
  reason text,
  created_at timestamptz default now()
);

create table gps_locations (
  location_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  accuracy_meters int,
  source text check (source in ('manual_checkin', 'geofence', 'hourly_ping', 'job_start', 'job_end')),
  is_geofenced_checkin boolean default false,
  distance_from_job_address_m int,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

create table geofences (
  geofence_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  job_id uuid references jobs(job_id),
  customer_id uuid references customers(customer_id),
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  radius_meters int default 50,
  is_active boolean default true,
  notify_on_enter boolean default true,
  notify_on_exit boolean default true,
  created_at timestamptz default now()
);

create table technician_location_daily (
  daily_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  work_date date,
  total_distance_km numeric(10, 2),
  total_time_hours numeric(10, 2),
  jobs_completed int,
  route_coordinates jsonb,
  idle_time_minutes int,
  driving_time_minutes int,
  job_time_minutes int,
  created_at timestamptz default now()
);

create table sales_territories (
  territory_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  territory_name text,
  neighborhoods jsonb,
  polygon_coordinates jsonb,
  total_customers int default 0,
  active_customers int default 0,
  monthly_revenue numeric(12, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leads (
  lead_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  first_name text,
  last_name text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  status text check (status in ('new', 'contacted', 'estimated', 'won', 'lost', 'recycled')) default 'new',
  lost_reason text,
  estimated_job_value numeric(10, 2),
  estimated_date date,
  follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leaderboard (
  leaderboard_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  sales_rep_id uuid references users(user_id),
  month int,
  year int,
  total_revenue numeric(12, 2),
  commission_estimated numeric(10, 2),
  commission_confirmed numeric(10, 2),
  leads_generated int,
  leads_converted int,
  conversion_rate numeric(5, 2),
  average_deal_size numeric(10, 2),
  rank int,
  discreet_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table shift_checklists (
  checklist_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  work_date date,
  start_checklist_completed boolean default false,
  start_checklist_time timestamptz,
  start_checklist_photo_url text,
  start_checklist_items jsonb,
  end_checklist_completed boolean default false,
  end_checklist_time timestamptz,
  end_checklist_photo_url text,
  end_checklist_items jsonb,
  shift_status text check (shift_status in ('pending', 'approved', 'incomplete')) default 'pending',
  approved_by uuid references users(user_id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table incidents (
  incident_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  technician_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  description text not null,
  incident_type text,
  severity text check (severity in ('minor', 'moderate', 'severe', 'critical')) default 'moderate',
  estimated_cost numeric(10, 2),
  actual_cost numeric(10, 2),
  photo_urls jsonb,
  report_date timestamptz,
  status text check (status in ('reported', 'under_review', 'approved', 'denied', 'resolved')) default 'reported',
  reviewed_by uuid references users(user_id),
  reviewed_at timestamptz,
  reviewer_notes text,
  commission_deduction numeric(10, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table job_quality_issues (
  issue_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  job_id uuid references jobs(job_id),
  customer_id uuid references customers(customer_id),
  complaint_type text,
  description text,
  severity text check (severity in ('minor', 'major', 'critical')) default 'major',
  reported_by text,
  reported_via text check (reported_via in ('sms', 'email', 'phone', 'in_app', 'inspection')) default 'sms',
  reported_date timestamptz,
  status text check (status in ('new', 'acknowledged', 'in_progress', 'resolved', 'escalated')) default 'new',
  assigned_to uuid references users(user_id),
  resolution_date date,
  resolution_notes text,
  follow_up_job_id uuid references jobs(job_id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  job_id uuid references jobs(job_id),
  invoice_number text unique,
  issued_date timestamptz,
  due_date date,
  subtotal numeric(10, 2),
  tax_amount numeric(10, 2),
  total_amount numeric(10, 2),
  payment_method text check (payment_method in ('interac', 'credit_card', 'check', 'cash')) default 'interac',
  payment_status text check (payment_status in ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue')) default 'draft',
  paid_amount numeric(10, 2) default 0,
  paid_date timestamptz,
  description text,
  notes text,
  pdf_url text,
  email_sent_date timestamptz,
  sms_reminder_sent_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table employee_commissions (
  commission_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  employee_id uuid references users(user_id),
  job_id uuid references jobs(job_id),
  service_price numeric(10, 2),
  commission_rate numeric(5, 2),
  estimated_commission numeric(10, 2),
  confirmed_commission numeric(10, 2),
  incident_deduction numeric(10, 2) default 0,
  quality_issue_deduction numeric(10, 2) default 0,
  final_commission numeric(10, 2),
  status text check (status in ('estimated', 'confirmed', 'paid', 'disputed')) default 'estimated',
  payment_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table payroll_statements (
  statement_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  employee_id uuid references users(user_id),
  year int,
  month int,
  base_salary numeric(10, 2),
  jobs_completed int,
  total_revenue numeric(12, 2),
  commission_confirmed numeric(10, 2),
  deductions numeric(10, 2),
  net_pay numeric(10, 2),
  pdf_url text,
  sent_date timestamptz,
  viewed_date timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  notif_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  user_id uuid references users(user_id),
  type text check (type in ('job_assigned', 'schedule_change', 'payment_received', 'commission_statement', 'weather_alert', 'quality_issue', 'no_show', 'incident', 'referral_earned')),
  title text,
  body text,
  icon_url text,
  related_resource_id uuid,
  related_resource_type text,
  channel text check (channel in ('in_app', 'email', 'sms', 'push')) default 'in_app',
  status text check (status in ('sent', 'delivered', 'read', 'failed')) default 'sent',
  is_read boolean default false,
  read_at timestamptz,
  action_url text,
  created_at timestamptz default now()
);

create table sms_messages (
  sms_id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(company_id),
  customer_id uuid references customers(customer_id),
  phone_number text,
  content text,
  direction text check (direction in ('inbound', 'outbound')),
  twilio_sid text unique,
  status text check (status in ('queued', 'sending', 'sent', 'delivered', 'failed')) default 'queued',
  related_job_id uuid references jobs(job_id),
  message_thread_id uuid,
  thread_id uuid,
  is_read boolean default false,
  assigned_to uuid references users(user_id),
  created_at timestamptz default now(),
  delivered_at timestamptz
);

create index idx_users_company_id on users(company_id);
create index idx_users_email on users(email);
create index idx_users_role on users(role);
create index idx_users_status on users(status);
create index idx_sessions_user_id on user_sessions(user_id);
create index idx_audit_user_id on user_audit_log(user_id);
create index idx_customers_company_id on customers(company_id);
create index idx_jobs_company_id on jobs(company_id);
create index idx_jobs_customer_id on jobs(customer_id);
create index idx_jobs_technician_id on jobs(technician_id);
create index idx_rating_tokens_job on customer_rating_tokens(job_id);
create index idx_rating_tokens_token on customer_rating_tokens(token);
create index idx_invoices_company_id on invoices(company_id);
create index idx_invoices_customer_id on invoices(customer_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_sms_thread on sms_messages(thread_id);
create index idx_sms_assigned on sms_messages(assigned_to) where is_read = false;

alter table users enable row level security;
alter table companies enable row level security;
alter table jobs enable row level security;
alter table customers enable row level security;
alter table invoices enable row level security;
alter table notifications enable row level security;
alter table leads enable row level security;
alter table sales_territories enable row level security;
alter table leaderboard enable row level security;
alter table shift_checklists enable row level security;
alter table incidents enable row level security;
alter table job_quality_issues enable row level security;
alter table employee_commissions enable row level security;
alter table payroll_statements enable row level security;
alter table sms_messages enable row level security;
alter table gps_locations enable row level security;
alter table geofences enable row level security;
alter table auth_challenges enable row level security;
alter table user_sessions enable row level security;
alter table user_audit_log enable row level security;
alter table technician_location_daily enable row level security;
alter table customer_rating_tokens enable row level security;
alter table customer_blacklist enable row level security;
alter table customer_communication enable row level security;
alter table job_assignments enable row level security;
alter table job_history enable row level security;

create policy users_self_or_admin on users
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = users.company_id
    )
  );

create policy users_admin_manage on users
  for all
  using (
    exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = users.company_id
    )
  );

create policy companies_company_read on companies
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy companies_company_write on companies
  for update
  using (company_id = (select company_id from users where user_id = auth.uid()))
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sessions_owner_read on user_sessions
  for select
  using (user_id = auth.uid());

create policy sessions_owner_write on user_sessions
  for insert
  with check (user_id = auth.uid());

create policy sessions_owner_update on user_sessions
  for update
  using (user_id = auth.uid());

create policy audit_owner_read on user_audit_log
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from users as admin_user
      where admin_user.user_id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.company_id = (select company_id from users where user_id = user_audit_log.user_id)
    )
  );

create policy audit_owner_write on user_audit_log
  for insert
  with check (user_id = auth.uid());

create policy tech_daily_company_read on technician_location_daily
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy tech_daily_company_write on technician_location_daily
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy jobs_company_read on jobs
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy jobs_company_write on jobs
  for insert
  with check (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy customers_company_read on customers
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy invoices_company_read on invoices
  for select
  using (
    company_id = (select company_id from users where user_id = auth.uid())
  );

create policy notifications_owner_read on notifications
  for select
  using (user_id = auth.uid());

create policy leads_company_read on leads
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy leads_company_write on leads
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy territories_company_read on sales_territories
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy territories_company_write on sales_territories
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy leaderboard_company_read on leaderboard
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy checklist_company_read on shift_checklists
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy checklist_company_write on shift_checklists
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy incidents_company_read on incidents
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy incidents_company_write on incidents
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy quality_company_read on job_quality_issues
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy quality_company_write on job_quality_issues
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy commissions_company_read on employee_commissions
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy commissions_company_write on employee_commissions
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy payroll_company_read on payroll_statements
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy payroll_company_write on payroll_statements
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_read on sms_messages
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_write on sms_messages
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy sms_company_update on sms_messages
  for update
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy gps_company_read on gps_locations
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy gps_company_write on gps_locations
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy geofence_company_read on geofences
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy challenges_owner_read on auth_challenges
  for select
  using (user_id = auth.uid());

create policy blacklist_company_read on customer_blacklist
  for select
  using (company_id = (select company_id from users where user_id = auth.uid()));

create policy blacklist_company_write on customer_blacklist
  for insert
  with check (company_id = (select company_id from users where user_id = auth.uid()));

create policy comm_company_read on customer_communication
  for select
  using (
    exists (
      select 1 from customers
      where customers.customer_id = customer_communication.customer_id
        and customers.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy assignments_company_read on job_assignments
  for select
  using (
    exists (
      select 1 from jobs
      where jobs.job_id = job_assignments.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy assignments_company_write on job_assignments
  for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.job_id = job_assignments.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy history_company_read on job_history
  for select
  using (
    exists (
      select 1 from jobs
      where jobs.job_id = job_history.job_id
        and jobs.company_id = (select company_id from users where user_id = auth.uid())
    )
  );

create policy rating_tokens_public_read on customer_rating_tokens
  for select
  using (true);

create policy rating_tokens_public_update on customer_rating_tokens
  for update
  using (used_at is null);
